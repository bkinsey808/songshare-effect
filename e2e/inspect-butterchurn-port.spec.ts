/* eslint-disable max-lines-per-function, @typescript-eslint/no-explicit-any, no-console, unicorn/no-null, @typescript-eslint/explicit-module-boundary-types, no-magic-numbers, no-empty */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;

test("butterchurn: port fallback renders when upstream createVisualizer fails", async ({ page }) => {
  // Force a minimal upstream library shape that *claims* to be present but will throw when instantiated.
  await page.addInitScript(() => {
    (globalThis as any).__butterchurn_lib = {
      createVisualizer: function createVisualizerFail(): never {
        throw new Error("forced-createVisualizer-failure-for-port-fallback-test");
      },
    };
  });

  // Stub getDisplayMedia to return an AudioContext-backed stream (same as other tests)
  await page.addInitScript(function initGetDisplayMedia(): void {
    const md: any = (navigator as any).mediaDevices;
    if (!md) {return;}
    md.getDisplayMedia = function getDisplayMediaStub(_opts: any): Promise<any> {
      try {
        const AudioContextCtor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        const ctx = new AudioContextCtor();
        const osc = ctx.createOscillator();
        try { osc.frequency.value = 10; } catch {}
        const dest = ctx.createMediaStreamDestination();
        osc.connect(dest);
        try { if (typeof osc.start === 'function') {osc.start();} } catch {}
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
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();

  // Wait for our stub to be called and for the port fallback to initialize
  await page.waitForFunction(() => (globalThis as any).__gdm_called !== undefined, {}, { timeout: 5000 });

  // Wait for the port adapter to mark itself as active
  await page.waitForFunction(() => !!(globalThis as any).__butterchurn_using_port, {}, { timeout: 5000 });

  // Wait for render activity signal or canvas change
  await page.waitForFunction(() => !!(globalThis as any).__butterchurn_render_active || !!document.querySelector('canvas'), {}, { timeout: 5000 });

  const audioRms = await page.evaluate(async () => {
    const audio = document.querySelector('audio');
    if (!audio) { return { found: false as const }; }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const audioEl = audio as HTMLAudioElement;
    audioEl.muted = true;
    try { void audioEl.play(); } catch {}
    try {
      const AudioContextCtor: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!AudioContextCtor) { return { found: true as const, rms: 0 }; }
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
      const startTime = Date.now();
      let rms = 0;
      while (Date.now() - startTime < 500) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const byte of data) {
          const val = byte - 128;
          sum += val * val;
        }
        rms = Math.sqrt(sum / data.length);
        if (rms > 1) { break; }
        // Yield briefly to allow the audio pipeline / rendering to progress
        // Use an async sleep rather than busy-waiting so we don't trigger lint rules
        // eslint-disable-next-line promise/avoid-new, no-await-in-loop, @typescript-eslint/no-empty-function
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      try { void ctx.close(); } catch {}
      return { found: true as const, rms };
    } catch {
      return { found: true as const, rms: 0 };
    }
  });

  // Check canvas changed as an indication of rendering
const canvasChanging = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) { return false; }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const canvasEl = canvas as HTMLCanvasElement;
    try {
      const before = canvasEl.toDataURL();
      const waitStart = Date.now();
      // Sample for up to ~300ms in short intervals
      while (Date.now() - waitStart < 300) {
        // eslint-disable-next-line promise/avoid-new, @typescript-eslint/no-empty-function, no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const after = canvasEl.toDataURL();
      return before !== after;
    } catch {
      return false;
    }
  });

  const usingPort = await page.evaluate(() => !!(globalThis as any).__butterchurn_using_port);
  const renderActive = await page.evaluate(() => !!(globalThis as any).__butterchurn_render_active);

  // Expect the port adapter to have been used and some rendering or audio activity to be observable
  expect(usingPort).toBeTruthy();
  expect(renderActive || canvasChanging || (audioRms.rms ?? 0) > 1).toBeTruthy();
});
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
test("butterchurn ported MVP renders visuals", async ({ page }) => {
  await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });
  await page.waitForTimeout(HYDRATION_WAIT_MS);

  // Click capture to start audio
  const captureBtn = page.locator("text=Capture system/tab audio").first();
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();

  // Wait for the app to use the ported visualizer
  await page.waitForFunction(() => !!((globalThis as any).__butterchurn_using_port), {}, { timeout: 10_000 });

  // Wait for render to become active
  await page.waitForFunction(() => !!((globalThis as any).__butterchurn_render_active), {}, { timeout: 10_000 });

  const usingPort = await page.evaluate(() => !!((globalThis as any).__butterchurn_using_port));
  const renderActive = await page.evaluate(() => !!((globalThis as any).__butterchurn_render_active));

  console.log('port status:', { usingPort, renderActive });

  expect(usingPort).toBeTruthy();
  expect(renderActive).toBeTruthy();
});