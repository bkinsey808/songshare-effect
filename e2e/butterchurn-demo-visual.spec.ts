/* eslint-disable max-lines-per-function, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-console, no-magic-numbers, no-empty */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;

test("butterchurn demo: capture system audio starts visualizer and renders", async ({ page }) => {
  // Stub getDisplayMedia to return an AudioContext-backed stream
  await page.addInitScript(function initGetDisplayMedia(): void {
    const md: any = (navigator as any).mediaDevices;
    if (!md) {
      return;
    }
    md.getDisplayMedia = function getDisplayMediaStub(_opts: any): Promise<any> {
      try {
        const AudioContextCtor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        const ctx = new AudioContextCtor();
        const osc = ctx.createOscillator();
        try { osc.frequency.value = 10; } catch { /* ignore */ }
        const dest = ctx.createMediaStreamDestination();
        osc.connect(dest);
        try { if (typeof osc.start === 'function') { osc.start(); } } catch { /* ignore */ }
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
  await captureBtn.waitFor({ state: "visible", timeout: 5000 });
  await captureBtn.click();

  // Wait for the render-active signal or canvas change
  await page.waitForFunction(() => !!(globalThis as any).__butterchurn_render_active || !!document.querySelector('canvas'), {}, { timeout: 5000 });

  const renderActive = await page.evaluate(() => !!(globalThis as any).__butterchurn_render_active);
  const canvasChanging = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const canvasEl = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvasEl) {
      return false;
    }
    try {
      const before = canvasEl.toDataURL();
      const start = Date.now();
      while (Date.now() - start < 300) {
        const busyEnd = Date.now() + 10;
        while (Date.now() < busyEnd) {
          // busy wait
        }
      }
      const after = canvasEl.toDataURL();
      return before !== after;
    } catch {
      return false;
    }
  });

  expect(renderActive || canvasChanging).toBeTruthy();
});
