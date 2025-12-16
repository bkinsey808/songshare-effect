/* eslint-disable max-lines-per-function, @typescript-eslint/no-explicit-any, no-console, unicorn/no-null, @typescript-eslint/explicit-module-boundary-types, no-magic-numbers, no-empty */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";

test("butterchurn port test page renders and produces canvas frames", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  await page.goto(`${BASE_URL}/test-pages/butterchurn-port-test.html`, { waitUntil: "load" });

  // Click the Start button to create/resume AudioContext (user gesture)
  const startBtn = page.locator('text=Start visualization').first();
  await startBtn.waitFor({ state: 'visible', timeout: 5000 });
  await startBtn.click();

  // Wait for the test page to signal the port adapter was used
  try {
    await page.waitForFunction(() => !!(globalThis as any).__butterchurn_using_port, {}, { timeout: 5000 });
  } catch (error) {
    // Dump console messages for diagnostics
    // eslint-disable-next-line no-console
    console.error('butterchurn-port-local.consoleMessages:', JSON.stringify(consoleMessages.slice(0, 50)));
    const preTexts = await page.$$eval('pre', (elements) => elements.map((el) => (el.textContent || '').slice(0, 2000)));
    // eslint-disable-next-line no-console
    console.error('butterchurn-port-local.preTexts:', JSON.stringify(preTexts));
    throw error;
  }

  // Wait for the port visualizer to set its render-active flag or create a canvas
  await page.waitForFunction(() => !!(globalThis as any).__butterchurn_render_active || !!document.querySelector('canvas'), {}, { timeout: 5000 });

  // Check that a canvas exists
  const canvasExists = await page.evaluate(() => !!document.querySelector('canvas'));
  expect(canvasExists).toBeTruthy();

  // Sample two frames to ensure canvas is updating
  const changed = await page.evaluate(() => {
    const canvasEl = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvasEl) { return false; }
    try {
      const before = canvasEl.toDataURL();
      const start = Date.now();
      while (Date.now() - start < 400) {
        const busyEnd = Date.now() + 10;
        while (Date.now() < busyEnd) {
          // busy-wait to sample next frame
        }
      }
      const after = canvasEl.toDataURL();
      return before !== after;
    } catch {
      return false;
    }
  });

  // Also assert that render-active was set
  const renderActive = await page.evaluate(() => !!(globalThis as any).__butterchurn_render_active);

  expect(renderActive || changed).toBeTruthy();
});
