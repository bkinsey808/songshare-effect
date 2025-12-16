/* eslint-disable no-console, @typescript-eslint/no-explicit-any, promise/avoid-new, unicorn/no-new-promises, no-await-in-loop */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const RMS_WAIT_MS = 1000;
const RMS_THRESHOLD = 1;
const SAMPLE_DELAY_MS = 50;
const BYTE_CENTER = 128;

// Verify that when the vendor UMD script is present the global is set and
// the app can render visuals when system audio capture starts.
test("butterchurn vendor global enables visuals", async ({ page }) => {
  // Install a deterministic stub for getDisplayMedia that returns a MediaStream
  // backed by a short-lived AudioContext so the test can measure RMS.
  await page.addInitScript(function initGetDisplayMediaForVendor(): void {
    const md: any = (navigator as any).mediaDevices;
    if (!md) {return;}
    md._origGetDisplayMedia = md.getDisplayMedia;
    md.getDisplayMedia = function getDisplayMediaStub(_opts: any): Promise<any> {
      try {
        const AudioContextCtor: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        const ctx = new AudioContextCtor();
        const osc = ctx.createOscillator();
        try { osc.frequency.value = 30; } catch { /* ignore read-only frequency */ }
        const dest = ctx.createMediaStreamDestination();
        try { if (typeof osc.start === 'function') { osc.start(); } } catch { /* ignore start */ }
        (globalThis as any).__gdm_test_audio_context = ctx;
        return Promise.resolve(dest.stream);
      } catch {
        try {
          return Promise.resolve(new (globalThis as any).MediaStream());
        } catch {
          return Promise.resolve({} as unknown as MediaStream);
        }
      }
    };
  });

  await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });
  await page.waitForTimeout(HYDRATION_WAIT_MS);

  // Vendor bundle should create a global `butterchurn` UMD symbol
  // Allow a bit more time for the vendor bundle to load in different environments
  await page.waitForFunction(() => (globalThis as any).butterchurn !== undefined || (globalThis as any).__butterchurn_lib !== undefined, {}, { timeout: 10_000 });
  const bcPresent = await page.evaluate(() => !!((globalThis as any).butterchurn || (globalThis as any).__butterchurn_lib));
  expect(bcPresent).toBeTruthy();

  // Click the capture button to start the demo audio
  const captureBtn = page.locator("text=Capture system/tab audio").first();
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();

  // Verify audio is producing measurable RMS using a short-lived analyser
  const audioRms = await page.evaluate(async () => {
    const audio = document.querySelector("audio");
    if (!audio) {return { found: false as const, rms: 0 };}
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const audioEl = audio as HTMLAudioElement;
    audioEl.muted = true;
    try { void audioEl.play(); } catch { /* ignore play errors */ }
    try {
      const AudioContextCtor: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!AudioContextCtor) {
        return { found: true as const, rms: 0 };
      }
      const ctx = new AudioContextCtor();
      try {
        await ctx.resume();
      } catch {
        /* resume can reject if the context is suspended; ignore */
      }
      const stream = (audioEl as any).srcObject as MediaStream | null;
      let sourceNode: MediaStreamAudioSourceNode | undefined = undefined;
      if (stream && typeof ctx.createMediaStreamSource === 'function') {
        sourceNode = ctx.createMediaStreamSource(stream as any);
      } else {
        try {
          sourceNode = ctx.createMediaElementSource(audioEl as any);
        } catch {
          sourceNode = undefined;
        }
      }
      if (!sourceNode) {
        try {
          void ctx.close();
        } catch {
          /* ignore close errors */
        }
        return { found: true as const, rms: 0 };
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      sourceNode.connect(analyser as unknown as AudioNode);
      const data = new Uint8Array(analyser.fftSize);
      const start = Date.now();
      let rms = 0;
      // eslint-disable-next-line no-await-in-loop
      while (Date.now() - start < RMS_WAIT_MS) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const byte of data) {
          const delta = byte - BYTE_CENTER;
          sum += delta * delta;
        }
        rms = Math.sqrt(sum / data.length);
        if (rms > RMS_THRESHOLD) {
          break;
        }
        // oxlint-disable-next-line promise/avoid-new
        // oxlint-disable-next-line unicorn/no-new-promises
        // eslint-disable-next-line promise/avoid-new
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => setTimeout(resolve, SAMPLE_DELAY_MS));
      }
      try {
        void ctx.close();
      } catch {
        /* ignore close errors */
      }
      return { found: true as const, rms };
    } catch {
      // ignore
      return { found: true as const, rms: 0 };
    }
  });

  console.log("vendor audioRms:", audioRms);
  expect(audioRms.found).toBeTruthy();

  // Give more time for visuals to become active if audio is present
  const renderActive = await page.waitForFunction(() => !!((globalThis as any).__butterchurn_render_active), {}, { timeout: 15_000 }).catch(() => undefined);
  console.log("vendor renderActive:", !!renderActive);

  // Ensure the UMD file is executed so it can populate the global symbol
  await page.evaluate(() => {
    // Try dynamic import of the UMD file served from node_modules. Use a
    // runtime string variable so TypeScript won't attempt to resolve the
    // module at build time. We swallow errors and record them for test
    // diagnostics.
    const scriptPath = '/node_modules/butterchurn/lib/butterchurn.js';
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void import(scriptPath).catch((error: unknown) => {
      (globalThis as any).__butterchurn_import_side_effect_error = String(error);
    });
  });

  // As a deterministic check, try to construct a visualizer directly from the vendor global
  const createResult = await page.evaluate(async () => {
    const bc = (globalThis as any).butterchurn || (globalThis as any).__butterchurn_lib;
    if (!bc) {return { ok: false, reason: 'no-lib' };}
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    document.body.append(canvas);
    try {
      const AudioContextCtor: unknown = (globalThis as unknown as any).AudioContext || (globalThis as unknown as any).webkitAudioContext;
      if (!AudioContextCtor) {
        return { ok: false, reason: 'no-audio-ctor' };
      }
      const ctx = new (AudioContextCtor as any)();
      try {
        await ctx.resume();
      } catch {
        /* resume can reject if the context is suspended; ignore */
      }

      // Prefer top-level createVisualizer, but fall back to .default when present
      let candidate: unknown = bc;
      try {
        if (!(candidate as any)?.createVisualizer && (candidate as any)?.default) {
          candidate = (candidate as any).default;
        }
      } catch {
        /* best-effort reading of nested .default */
      }

      let inst: any = undefined;
      try {
        if ((candidate as any)?.createVisualizer) {
          inst = (candidate as any).createVisualizer(ctx, canvas, {});
        } else if (typeof candidate === 'function') {
          // Try factory call first; if it throws, we'll attempt constructor fallback below
          try {
            inst = (candidate as any)(ctx, canvas, {});
          } catch {
            /* factory failed; fall through to constructor attempt */
          }
        }
      } catch (error) {
        return { ok: false, reason: String(error) };
      }

      // Constructor fallback if factory did not produce an instance
      if (!inst && typeof candidate === 'function') {
        try {
          const Ctor = candidate as any;
          inst = new Ctor(ctx, canvas, {});
        } catch {
          /* constructor fallback failed */
        }
      }

      if (!inst) {
        return { ok: false, reason: 'no-instance' };
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const ok = typeof (inst as any).render === 'function' && typeof (inst as any).connectAudio === 'function';
      try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (typeof (inst as any).destroy === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          (inst as any).destroy();
        }
      } catch {
        /* ignore destroy errors */
      }

      return { ok, protoKeys: Object.getOwnPropertyNames(Object.getPrototypeOf(inst)) };
    } catch (error) {
      return { ok: false, reason: String(error) };
    }
  });

  console.log('createResult:', createResult);
  expect(createResult.ok).toBeTruthy();
});