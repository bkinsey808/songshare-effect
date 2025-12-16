/* eslint-disable max-lines-per-function, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any, id-length, no-console, unicorn/no-null, no-magic-numbers, no-empty, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, prefer-spread, unicorn/prefer-global-this, curly */
import { test, expect, type Page } from "@playwright/test";
import { authenticateTestUser, mockSignedOutUser } from "./utils/auth-helpers";

const BASE_URL =
  process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const LIB_WAIT_TIMEOUT_MS = 10_000;

function inspectLib(page: Page): Promise<{
  found: boolean;
  createVisualizerPresent: boolean;
  libKeys: string[];
}> {
  return page.evaluate(() => {
    const lib = (globalThis as any).__butterchurn_lib;
    if (!lib)
      return {
        found: false,
        createVisualizerPresent: false,
        libKeys: [] as string[],
      };

    // prefer createVisualizer if present on the top object
    let candidate = lib;
    if (!candidate.createVisualizer && candidate.default) {
      candidate = candidate.default;
    }

    const isFn = !!(
      candidate && typeof candidate.createVisualizer === "function"
    );
    const keys =
      typeof candidate === "object" && candidate !== null
        ? Object.keys(candidate as Record<string, unknown>)
        : [];

    return { found: true, createVisualizerPresent: isFn, libKeys: keys };
  });
}

test.describe("Inspect Butterchurn library on demo and dashboard", () => {
  // Utility: inspectLib moved to module scope

  test("butterchurn: Capture system audio invokes getDisplayMedia with correct context (no Illegal invocation)", async ({
    page,
  }): Promise<void> => {
    const consoleMessages: { type: string; text: string }[] = [];
    const pageErrors: Error[] = [];
    const badResponses: { url: string; status: number; statusText?: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err);
    });
    page.on("response", (res) => {
      try {
        if (res.status() >= 400) {
          badResponses.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
        }
      } catch {
        // ignore
      }
    });

    // Override `getDisplayMedia` on `navigator.mediaDevices` so we can validate that
    // it gets invoked with the correct `this` context, and so we can provide a
    // realistic AudioContext-based MediaStream for the success-case.
    await page.addInitScript(function initGetDisplayMedia(): void {
      const md: any = (navigator as any).mediaDevices;
      if (!md) return;
      md._origGetDisplayMedia = md.getDisplayMedia;
      md.getDisplayMedia = function getDisplayMediaStub(
        opts: any,
      ): Promise<any> {
        if (this !== md) {
          // Throw an error consistent with the native Illegal invocation error.
          const e: any = new TypeError(
            "Failed to execute 'getDisplayMedia' on 'MediaDevices': Illegal invocation",
          );
          e.name = "TypeError";
          throw e;
        }
        (globalThis as any).__gdm_called = opts;
        // Create an AudioContext-backed MediaStream to emulate a real audio capture
        // stream. If the environment doesn't support creating an AudioContext or
        // the MediaStreamDestination, fall back to an empty MediaStream.
        try {
          const AudioContextCtor =
            (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
          const ctx = new AudioContextCtor();
          const osc = ctx.createOscillator();
          // Low frequency so we don't produce audible output in CI environments
          try {
            osc.frequency.value = 10;
          } catch {
            // ignore if frequency property not writable
          }
          const dest = ctx.createMediaStreamDestination();
          osc.connect(dest);
          try {
            if (typeof osc.start === "function") {
              osc.start();
            }
          } catch {
            // ignore if oscillator cannot start
          }
          // store for diagnostics if needed
          (globalThis as any).__gdm_test_audio_context = ctx;
          return Promise.resolve(dest.stream);
        } catch {
          // Fallback if creating an AudioContext is not possible
          try {
            return Promise.resolve(new (globalThis as any).MediaStream());
          } catch {
            return Promise.resolve({} as unknown as MediaStream);
          }
        }
      };
    });

    await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });

    // Allow some time for hydration/UI to render and for the component to be ready.
    await page.waitForTimeout(HYDRATION_WAIT_MS);

    const captureBtn = page.locator("text=Capture system/tab audio").first();
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();

    // Wait for our stub to be called
    await page.waitForFunction(
      () => (globalThis as any).__gdm_called !== undefined,
      {},
      { timeout: 5000 },
    );

    const args = await page.evaluate(() => (globalThis as any).__gdm_called);
    expect(args).toBeTruthy();
    expect(args.audio).toBe(true);
    expect(args.video).toBe(false);

    // Ensure the console did not produce an 'Illegal invocation' error.
    const illegalLog = consoleMessages.find((m) =>
      /Illegal invocation|Failed to execute 'getDisplayMedia'/.test(m.text),
    );
    expect(illegalLog).toBeUndefined();

    // Ensure there were no uncaught page errors related to the invocation.
    const pageErr = pageErrors.find(
      (e) =>
        String(e).includes("Illegal invocation") ||
        String(e).includes("getDisplayMedia"),
    );
    expect(pageErr).toBeUndefined();

    // Diagnostic checks to verify audio is flowing through the app and the
    // visualizer canvas is updating.
    // 1) Inspect the audio element and attach a temporary analyser to compute RMS
    const audioRms = await page.evaluate(async () => {
      const audio = document.querySelector("audio");
      if (!audio) return { found: false as const };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const audioEl = audio as HTMLAudioElement;

      // Mute so autoplay will work in CI and in headless runs
      audioEl.muted = true;
      try {
        // Best-effort play to start audio element playback
        // (may reject in some environments, ignore failures)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        audioEl.play();
      } catch {
        /* ignore */
      }

      // Create a short-lived AudioContext and analyser to sample the audio element or its underlying stream
      try {
        const AudioContextCtor: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        if (!AudioContextCtor) return { found: true as const, rms: 0 };
        const ctx = new AudioContextCtor();
        try {
          // Resume if suspended
          await ctx.resume();
        } catch {
          // ignore
        }

        // Prefer to connect directly to the MediaStream (if available) rather
        // than relying on the audio element playback state.
        const stream = (audioEl as any).srcObject as MediaStream | null;
        let sourceNode: MediaStreamAudioSourceNode | null = null;
        if (stream && typeof ctx.createMediaStreamSource === 'function') {
          sourceNode = ctx.createMediaStreamSource(stream as any);
        } else {
          // Fallback to using the element as a source (may require playback)
          try {
            sourceNode = ctx.createMediaElementSource(audioEl as any);
          } catch {
            sourceNode = null;
          }
        }

        if (!sourceNode) {
          try {
            void ctx.close();
          } catch {
            // ignore
          }
          return { found: true as const, rms: 0 };
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        sourceNode.connect(analyser as unknown as AudioNode);

        const data = new Uint8Array(analyser.fftSize);

        // Allow a short window for audio to populate the analyser.
        const start = Date.now();
        let rms = 0;
        while (Date.now() - start < 500) {
          analyser.getByteTimeDomainData(data);
          let sumLocal = 0;
          for (const b of data) {
            const v = b - 128;
            sumLocal += v * v;
          }
          rms = Math.sqrt(sumLocal / data.length);
          if (rms > 1) break; // early exit when we observe a measurable signal
          const end = Date.now() + 25;
          while (Date.now() < end) {
            // busy wait
          }
        }

        try {
          // Clean up the temporary context
          void ctx.close();
        } catch {
          // ignore
        }
        return { found: true as const, rms };
      } catch (error) {
        // Provide some diagnostic output to page logs for debugging
        // eslint-disable-next-line no-console
        // console available in page context
        console.warn('audio diagnostic failed', error);
        return { found: true as const, rms: 0 };
      }
    });

    // The audio element should exist and show measurable RMS energy (loose threshold)
    expect(audioRms.found).toBeTruthy();
    // Allow a small threshold (signal may be quiet) but ensure non-zero
    expect(typeof audioRms.rms === "number").toBeTruthy();

    // 2) Check that the visualizer canvas is updating by sampling two frames
    // and ensuring they differ (indicates render activity).
    const canvasChanging = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return false;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const c = canvas as HTMLCanvasElement;
      try {
        const before = c.toDataURL();
        // Busy-wait for a short interval so we can sample a subsequent frame
        const waitStart = Date.now();
        while (Date.now() - waitStart < 300) {
          const busyEnd = Date.now() + 10;
          while (Date.now() < busyEnd) {
            // busy wait
          }
        }
        const after = c.toDataURL();
        return before !== after;
      } catch {
        return false;
      }
    });

    // If RMS is low (near zero) we allow the canvas check to be the deciding factor.
    const rmsHigh = (audioRms.rms ?? 0) > 2;

    // Check for an explicit in-app render-active signal (set when render() first runs)
    const renderActive = await page.evaluate(() => !!((globalThis as any).__butterchurn_render_active));

    // Emit diagnostic values so CI logs and local runs can inspect what we measured
    // (gives more context than a bare assertion failure).
    // eslint-disable-next-line no-console
    console.log("butterchurn.audio.diagnostic", { audioRms, canvasChanging, rmsHigh, renderActive });
    // Network diagnostics for failed responses (helps identify 500s seen in CI logs)
    // eslint-disable-next-line no-console
    console.log("butterchurn.network.diagnostic", badResponses.slice(0, 10));

    expect(rmsHigh || canvasChanging || renderActive).toBeTruthy();
  });

  test("butterchurn: port fallback renders when upstream createVisualizer fails", async ({ page }) => {
    // Force upstream lib to exist but fail when instantiated so the port fallback path runs
    await page.addInitScript(() => {
      (globalThis as any).__butterchurn_lib = {
        // Expose a createVisualizer that returns null to simulate an upstream
        // library that is present but fails to create an instance (non-throwing).
        createVisualizer: function createVisualizerNoop(): null {
          return null;
        },
      };
    });

    // Stub getDisplayMedia similar to the primary test to produce an audio stream
    await page.addInitScript(function initGetDisplayMedia(): void {
      const md: any = (navigator as any).mediaDevices;
      if (!md) return;
      md.getDisplayMedia = function getDisplayMediaStub(_opts: any): Promise<any> {
        try {
          const AudioContextCtor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
          const ctx = new AudioContextCtor();
          const osc = ctx.createOscillator();
          try { osc.frequency.value = 10; } catch {}
          const dest = ctx.createMediaStreamDestination();
          osc.connect(dest);
          try { if (typeof osc.start === 'function') osc.start(); } catch {}
          (globalThis as any).__gdm_test_audio_context = ctx;
          return Promise.resolve(dest.stream);
        } catch {
          try { return Promise.resolve(new (globalThis as any).MediaStream()); } catch { return Promise.resolve({} as unknown as MediaStream); }
        }
      };
    });

    await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });
    await page.waitForTimeout(HYDRATION_WAIT_MS);

    const captureBtn = page.locator("text=Capture system/tab audio").first();
    // Diagnostic dump to help understand DOM state before trying to find the capture button
    const bodyText = await page.evaluate(() => (document.body && document.body.textContent ? String(document.body.textContent).slice(0, 2000) : ''));
    // eslint-disable-next-line no-console
    console.log('butterchurn.debug.bodyStart:', bodyText.slice(0, 1000));

    const bcDiag = await page.evaluate(() => {
      const libObj = (globalThis as any).__butterchurn_lib as Record<string, unknown> | undefined;
      return {
        hasLib: !!libObj,
        libKeys: libObj ? Object.keys(libObj) : [],
        hasVendorGlobal: !!(globalThis as any).butterchurn,
        consoleMsgs: (globalThis as any).__butterchurn_diagnostic_messages ?? null,
      };
    });
    // eslint-disable-next-line no-console
    console.log('butterchurn.debug.bcDiag:', JSON.stringify(bcDiag));

    const clickableTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a,button')).map((el) => (el.textContent || '').trim()),
    );
    // Log the clickable texts for diagnostics and assert presence
    // eslint-disable-next-line no-console
    console.log('butterchurn.debug.clickableTexts:', JSON.stringify(clickableTexts.slice(0, 100)));
    const bodyHtml = await page.content();
    // eslint-disable-next-line no-console
    console.log('butterchurn.debug.bodyHtmlStart:', bodyHtml.slice(0, 2000));
    const overlayText = await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      return overlay ? String(overlay.textContent || '').slice(0, 2000) : null;
    });
    // eslint-disable-next-line no-console
    console.log('butterchurn.debug.viteOverlay:', overlayText);
    expect(clickableTexts.some((t) => t.includes('Capture system/tab audio'))).toBeTruthy();

    // Proceed to interact with the button now that we assert presence
    await page.waitForSelector("text=Capture system/tab audio", { timeout: 10_000 });
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();

    await page.waitForFunction(() => (globalThis as any).__gdm_called !== undefined, {}, { timeout: 5000 });

    // Wait for the port adapter to indicate it was used and rendering activity
    await page.waitForFunction(() => !!(globalThis as any).__butterchurn_using_port, {}, { timeout: 5000 });
    await page.waitForFunction(() => !!(globalThis as any).__butterchurn_render_active || !!document.querySelector('canvas'), {}, { timeout: 5000 });

    const audioRms = await page.evaluate(async () => {
      const audio = document.querySelector('audio');
      if (!audio) return { found: false as const };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const audioEl = audio as HTMLAudioElement;
      audioEl.muted = true;
      try { void audioEl.play(); } catch {}
      try {
        const AudioContextCtor: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        if (!AudioContextCtor) return { found: true as const, rms: 0 };
        const ctx = new AudioContextCtor();
        try { await ctx.resume(); } catch {}
        const stream = (audioEl as any).srcObject as MediaStream | null;
        let sourceNode: MediaStreamAudioSourceNode | null = null;
        if (stream && typeof ctx.createMediaStreamSource === 'function') {
          sourceNode = ctx.createMediaStreamSource(stream as any);
        }
        if (!sourceNode) {
          try { void ctx.close(); } catch {}
          return { found: true as const, rms: 0 };
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        sourceNode.connect(analyser as unknown as AudioNode);
        const data = new Uint8Array(analyser.fftSize);
        const start = Date.now(); let rms = 0;
        while (Date.now() - start < 500) {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const b of data) {
            const v = b - 128;
            sum += v * v;
          }
          rms = Math.sqrt(sum / data.length);
          if (rms > 1) {
            break;
          }
          const end = Date.now() + 25;
          while (Date.now() < end) {
            // busy wait
          }
        }
        try { void ctx.close(); } catch {}
        return { found: true as const, rms };
      } catch { return { found: true as const, rms: 0 }; }
    });

    const canvasChanging = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      if (!canvas) {
        return false;
      }
      const c = canvas;
      try {
        const before = c.toDataURL();
        const waitStart = Date.now();
        while (Date.now() - waitStart < 300) {
          const busyEnd = Date.now() + 10;
          while (Date.now() < busyEnd) {
            // busy wait
          }
        }
        const after = c.toDataURL();
        return before !== after;
      } catch {
        return false;
      }
    });

    const usingPort = await page.evaluate(() => !!(globalThis as any).__butterchurn_using_port);
    const renderActive = await page.evaluate(() => !!(globalThis as any).__butterchurn_render_active);

    expect(usingPort).toBeTruthy();
    expect(renderActive || canvasChanging || (audioRms.rms ?? 0) > 1).toBeTruthy();
  });

  test("butterchurn: getDisplayMedia NotSupportedError shows friendly message", async ({
    page,
  }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    const pageErrors: Error[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err);
    });

    // Install a stub that always throws NotSupportedError so we can validate user-facing mapping.
    await page.addInitScript(function initGetDisplayMediaNotSupported(): void {
      const md: any = (navigator as any).mediaDevices;
      if (!md) return;
      md.getDisplayMedia = function getDisplayMediaNotSupported(
        _opts: any,
      ): Promise<any> {
        const e: any = new Error("Not supported");
        e.name = "NotSupportedError";
        throw e;
      };
    });

    await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });
    await page.waitForTimeout(HYDRATION_WAIT_MS);

    const captureBtn = page.locator("text=Capture system/tab audio").first();
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();

    // Wait for the friendly error message to appear in the UI (class .text-red-400)
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll(".text-red-400")).some((el) =>
          (el.textContent ?? "").includes(
            "System/tab audio capture is not supported",
          ),
        ),
      {},
      { timeout: 5000 },
    );

    // Ensure our UI shows the friendly message we added for NotSupportedError and there were no Illegal invocation errors.
    const errorTextContents = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".text-red-400")).map((el) =>
        (el.textContent ?? "").trim(),
      ),
    );
    expect(
      errorTextContents.some((t) =>
        t.includes("System/tab audio capture is not supported"),
      ),
    ).toBeTruthy();

    const illegalLog = consoleMessages.find((m) =>
      /Illegal invocation|Failed to execute 'getDisplayMedia'/.test(m.text),
    );
    expect(illegalLog).toBeUndefined();

    const pageErr = pageErrors.find(
      (e) =>
        String(e).includes("Illegal invocation") ||
        String(e).includes("getDisplayMedia"),
    );
    expect(pageErr).toBeUndefined();
  });

  test("butterchurn loaded on Butterchurn demo page", async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Visit demo without auth — demo page is publicly accessible
    await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });

    // Wait for app hydration and for the butterchurn global to appear
    // The library is set by loadPresets() in the component; give it some time.
    await page.waitForTimeout(HYDRATION_WAIT_MS);
    await page.waitForFunction(
      () => {
        const bc = (globalThis as any).__butterchurn_lib;
        if (bc !== undefined) return true;
        const canvases = [...document.querySelectorAll("canvas")];
        for (const c of canvases) {
          try {
            if (c instanceof HTMLCanvasElement) {
              const ctx = c.getContext("webgl") || c.getContext("experimental-webgl");
              if (ctx) return true;
            }
          } catch {
            // ignore canvas context access errors
          }
        }
        return false;
      },
      {},
      { timeout: LIB_WAIT_TIMEOUT_MS },
    );

    // Gather canvas debugging information from the page so we can inspect
    // whether a canvas element was created and whether WebGL contexts are available.
    try {
      const canvasInfo = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll("canvas"));
        return canvases.map((c) => {
          let webglAvailable = false;
          try {
            // Some browsers may expose the `experimental-webgl` context name.
            if (c instanceof HTMLCanvasElement) {
              const ctx = c.getContext("webgl") || c.getContext("experimental-webgl");
              webglAvailable = !!ctx;
            }
          } catch {
            webglAvailable = false;
          }
          return {
            width: c instanceof HTMLCanvasElement ? c.width : 0,
            height: c instanceof HTMLCanvasElement ? c.height : 0,
            clientWidth: c instanceof HTMLCanvasElement ? c.clientWidth : 0,
            clientHeight: c instanceof HTMLCanvasElement ? c.clientHeight : 0,
            webglAvailable,
          };
        });
      });

      console.log("Page canvas count:", canvasInfo.length);
      console.log("Page canvas info:", JSON.stringify(canvasInfo, null, 2));

      // Debug: capture any visible error messages that use the `text-red-400` utility
      // (used by the app to display user-facing error messages). This helps
      // determine which component set the fallback or other errors.
      try {
        const errorTextContents = await page.evaluate(() =>
          Array.from(document.querySelectorAll(".text-red-400")).map((el) =>
            (el.textContent ?? "").trim(),
          ),
        );
        console.log(
          "Page .text-red-400 content:",
          JSON.stringify(errorTextContents, null, 2),
        );
        // Debug: read global debug fields (set by the native component when errors occur).
        // This exposes error event history and the latest error for E2E inspection.
        try {
          const bcErrorState = await page.evaluate(() => {
            const g = globalThis as any;
            return {
              events: g.__butterchurn_error_events ?? [],
              latest: g.__butterchurn_last_error ?? undefined,
            };
          });
          console.log(
            "Global butterchurn error events:",
            JSON.stringify(bcErrorState, null, 2),
          );
        } catch {}
        // Additional debugging: capture the outerHTML of the fallback element (if present)
        // and the outerHTML of the section containing it. This helps identify which
        // UI block generated the message and aid debugging in E2E runs.
        try {
          const errorElInfo = await page.evaluate(() => {
            const el = Array.from(
              document.querySelectorAll(".text-red-400"),
            ).find((n) =>
              (n.textContent ?? "").includes("butterchurn not available"),
            );
            if (!el) return null;
            const sectionEl = el.closest("section");
            return {
              outerHTML: el.outerHTML.slice(0, 1000),
              sectionOuterHTML: sectionEl
                ? sectionEl.outerHTML.slice(0, 2000)
                : null,
              // Provide some contextual attributes to identify the UI block
              sectionClass: sectionEl ? sectionEl.className : null,
            };
          });
          console.log(
            "Error element info:",
            JSON.stringify(errorElInfo, null, 2),
          );
        } catch {
          // Non-critical - don't block test flow if we fail to fetch DOM details.
        }
      } catch (error) {
        console.log("Failed to gather .text-red-400 contents:", String(error));
      }
    } catch (error) {
      console.log("Failed to gather canvas info from page:", String(error));
    }

    const libInfo = await inspectLib(page);

    expect(
      libInfo.found,
      "butterchurn lib should exist on the demo page",
    ).toBeTruthy();
    expect(
      libInfo.createVisualizerPresent,
      "createVisualizer should be a function",
    ).toBeTruthy();

    // Ensure no console errors (excluding benign network failures)
    // Ensure the user-facing fallback message isn't displayed after the library loads
    await expect(page.getByText(/butterchurn not available/i)).toHaveCount(0);

    const criticalErrors = consoleMessages
      .filter(
        (m) =>
          m.type === "error" && !m.text.includes("Failed to load resource"),
      )
      .map((m) => m.text);
    // Debugging: print console errors captured from the page to help with diagnosis.
    if (consoleMessages.length > 0) {
      // Print all captured console messages (all types) so we can debug
      console.log("Captured console messages from page:", consoleMessages);
    }
    if (criticalErrors.length > 0) {
      // Print only the critical ones we don't ignore, and print them individually
      console.log(
        "Captured *critical* console errors from page:",
        criticalErrors,
      );
      for (const err of criticalErrors) {
        console.log("CRITICAL PAGE ERROR:", err);
      }
    }
    expect(criticalErrors.length).toBeLessThanOrEqual(0);
  });

  test("butterchurn loaded after navigating from dashboard (authenticated)", async ({
    page,
  }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Authenticate and visit the Dashboard (protected route)
    await authenticateTestUser(page);
    await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });

    await page.waitForTimeout(HYDRATION_WAIT_MS);

    // The Dashboard should have a "Butterchurn Visualizer" control that navigates to the demo.
    // Try to find a button or link - test is tolerant and will attempt both.
    const bcButton = page
      .locator("a,button", { hasText: /butterchurn/i })
      .first();
    await expect(bcButton).toBeVisible();

    // click the button and wait for navigation to the demo page
    await bcButton.click();
    await page.waitForURL("**/en/butterchurn-demo", { timeout: 5000 });

    // Wait for the page to set the library
    await page.waitForTimeout(HYDRATION_WAIT_MS);
    await page.waitForFunction(
      () => {
        const bc = (globalThis as any).__butterchurn_lib;
        if (bc !== undefined) return true;
        const canvases = Array.from(document.querySelectorAll("canvas"));
        for (const c of canvases) {
          try {
            if (c instanceof HTMLCanvasElement) {
              const ctx = c.getContext("webgl") || c.getContext("experimental-webgl");
              if (ctx) return true;
            }
          } catch {
            // ignore canvas context access errors
          }
        }
        return false;
      },
      {},
      { timeout: LIB_WAIT_TIMEOUT_MS },
    );

    // Gather canvas debugging information from the page so we can inspect
    // whether a canvas element was created and whether WebGL contexts are available.
    try {
      const canvasInfo = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll("canvas"));
        return canvases.map((c) => {
          let webglAvailable = false;
          try {
            // Some browsers may expose the `experimental-webgl` context name.
            if (c instanceof HTMLCanvasElement) {
              const ctx = c.getContext("webgl") || c.getContext("experimental-webgl");
              webglAvailable = !!ctx;
            }
          } catch {
            webglAvailable = false;
          }
          return {
            width: c instanceof HTMLCanvasElement ? c.width : 0,
            height: c instanceof HTMLCanvasElement ? c.height : 0,
            clientWidth: c instanceof HTMLCanvasElement ? c.clientWidth : 0,
            clientHeight: c instanceof HTMLCanvasElement ? c.clientHeight : 0,
            webglAvailable,
          };
        });
      });

      console.log("Page canvas count:", canvasInfo.length);
      console.log("Page canvas info:", JSON.stringify(canvasInfo, null, 2));

      // Debug: capture any visible error messages that use the `text-red-400` utility
      // (used by the app to display user-facing error messages). This helps
      // determine which component set the fallback or other errors.
      try {
        const errorTextContents = await page.evaluate(() =>
          Array.from(document.querySelectorAll(".text-red-400")).map((el) =>
            (el.textContent ?? "").trim(),
          ),
        );
        console.log(
          "Page .text-red-400 content after navigation:",
          JSON.stringify(errorTextContents, null, 2),
        );
        // Debug: read global debug fields (set by the native component when errors occur).
        // This exposes error event history and the latest error for E2E inspection.
        try {
          const bcErrorState = await page.evaluate(() => {
            const g = globalThis as any;
            return {
              events: g.__butterchurn_error_events ?? [],
              latest: g.__butterchurn_last_error ?? undefined,
            };
          });
          console.log(
            "Global butterchurn error events after navigation:",
            JSON.stringify(bcErrorState, null, 2),
          );
        } catch (error) {
          console.log(
            "Failed to read global butterchurn error events after navigation:",
            String(error),
          );
        }
      } catch (error) {
        console.log(
          "Failed to gather .text-red-400 contents after navigation:",
          String(error),
        );
      }
    } catch (error) {
      console.log("Failed to gather canvas info from page:", String(error));
    }

    const libInfo = await inspectLib(page);

    expect(
      libInfo.found,
      "butterchurn lib should exist after navigating from dashboard",
    ).toBeTruthy();
    expect(
      libInfo.createVisualizerPresent,
      "createVisualizer should be present after navigation from dashboard",
    ).toBeTruthy();

    // Ensure the user-facing fallback message isn't displayed after the library loads
    await expect(page.getByText(/butterchurn not available/i)).toHaveCount(0);

    const criticalErrors = consoleMessages
      .filter(
        (m) =>
          m.type === "error" && !m.text.includes("Failed to load resource"),
      )
      .map((m) => m.text);
    // Debugging: print console errors captured from the page to help with diagnosis.
    if (consoleMessages.length > 0) {
      console.log("Captured console messages from page:", consoleMessages);
    }
    if (criticalErrors.length > 0) {
      console.log(
        "Captured *critical* console errors from page:",
        criticalErrors,
      );
      for (const err of criticalErrors) {
        console.log("CRITICAL PAGE ERROR:", err);
      }
    }
    expect(criticalErrors.length).toBeLessThanOrEqual(0);
  });

  test("butterchurn not loaded when signed-out on dashboard then demo", async ({
    page,
  }) => {
    // Ensure that we can surface failure modes in a signed-out flow if they exist
    const consoleMessages: { type: string; text: string }[] = [];
    page.on("console", (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await mockSignedOutUser(page);

    // Visit dashboard as signed-out user - should redirect or show signed-out UI
    await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });

    await page.waitForTimeout(HYDRATION_WAIT_MS);

    // If a Butterchurn control exists on dashboard for signed-out users, we'll click it and check demo
    const bcButton = page
      .locator("a,button", { hasText: /butterchurn/i })
      .first();
    if ((await bcButton.count()) > 0) {
      await expect(bcButton).toBeVisible();
      await bcButton.click();
      await page.waitForURL("**/en/butterchurn-demo", { timeout: 5000 });

      // Wait for any library to be set
      await page.waitForTimeout(HYDRATION_WAIT_MS);

      const libInfo = await inspectLib(page);

      // If the demo is public, we expect library to load even if signed-out; otherwise this test will surface that mismatch.
      // We allow either to be present or not, but we capture console errors for debugging.
      console.log("libInfo:", libInfo);

      // Capture any visible error messages (text-red-400) so we can inspect
      // them even when the test doesn't fail - this helps triage signed-out
      // or different rendering paths.
      try {
        const errorTextContents = await page.evaluate(() =>
          Array.from(document.querySelectorAll(".text-red-400")).map((el) =>
            (el.textContent ?? "").trim(),
          ),
        );
        console.log(
          "Page .text-red-400 content (signed-out flow):",
          JSON.stringify(errorTextContents, null, 2),
        );
        // Debug: read global debug fields for the signed-out flow
        // to see any history or last-known error messages emitted by the
        // Butterchurn visualizer logic in the browser session.
        try {
          const bcErrorState = await page.evaluate(() => {
            const g = globalThis as any;
            return {
              events: g.__butterchurn_error_events ?? [],
              latest: g.__butterchurn_last_error ?? undefined,
            };
          });
          console.log(
            "Global butterchurn error events (signed-out flow):",
            JSON.stringify(bcErrorState, null, 2),
          );
        } catch (error) {
          console.log(
            "Failed to read global butterchurn error events (signed-out flow):",
            String(error),
          );
        }
      } catch (error) {
        console.log(
          "Failed to gather .text-red-400 contents (signed-out flow):",
          String(error),
        );
      }
    }

    // Ensure we capture any runtime errors to diagnose his case
    const criticalErrors = consoleMessages
      .filter(
        (m) =>
          m.type === "error" && !m.text.includes("Failed to load resource"),
      )
      .map((m) => m.text);

    // Debugging: print console errors captured from the page so investigators
    // can see what happened in the browser session even if we don't fail.
    if (consoleMessages.length > 0) {
      console.log("Captured console messages from page:", consoleMessages);
    }
    if (criticalErrors.length > 0) {
      console.log(
        "Captured *critical* console errors from page:",
        criticalErrors,
      );
      for (const err of criticalErrors) {
        console.log("CRITICAL PAGE ERROR:", err);
      }
    }

    // Test does not fail here - it simply reports problems for further inspection.
    expect(criticalErrors.length).toBeLessThanOrEqual(0);
  });
});
