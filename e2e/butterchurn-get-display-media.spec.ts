/* eslint-disable @typescript-eslint/no-explicit-any, no-console, unicorn/no-null */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";

const MAX_LOGS = 50;
const SNIPPET_LEN = 2000;
const START_IDX = 0;

test("getDisplayMedia path reports NotSupportedError when system audio isn't available", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

  await page.goto(`${BASE_URL}/test-pages/butterchurn-port-test.html`, { waitUntil: 'load' });

  // Ensure UI is ready and start the visualization (gives us an AudioContext and visualizer)
  const startBtn = page.locator('text=Start visualization').first();
  await startBtn.waitFor({ state: 'visible', timeout: 5000 });
  await startBtn.click();

  // Click the Use system audio button which calls getDisplayMedia
  const sysBtn = page.locator('#use-system-audio');
  await sysBtn.waitFor({ state: 'visible', timeout: 5000 });

  await sysBtn.click();

  // Wait for the status element to reflect the result of getDisplayMedia
  const status = page.locator('#status');
  await status.waitFor({ state: 'visible', timeout: 5000 });

  // Wait for status to update to either success or an error message
  await page.waitForFunction(() => {
    const statusEl = document.querySelector('#status');
    if (!statusEl) { return false; }
    const txt = (statusEl.textContent || '').toLowerCase();
    return txt.includes('getdisplaymedia error') || txt.includes('system audio connected') || txt.includes('no stream received');
  }, {}, { timeout: 5000 });

  const statusText = await status.textContent() || '';

  // If it errored, assert that it mentions NotSupported or "Not supported"
  if (statusText.toLowerCase().includes('getdisplaymedia error')) {
    const ok = /notsupported|not supported|notsupportederror/i.test(statusText);
    if (!ok) {
      // Dump console and pre contents for debugging
      // eslint-disable-next-line no-console
      console.error('getDisplayMedia.spec.consoleMessages:', JSON.stringify(consoleMessages.slice(START_IDX, MAX_LOGS)));
      const preTexts = await page.$$eval('pre', (elements) => elements.map((el) => (el.textContent || '')));
      const snippets = preTexts.map((t: string) => t.slice(START_IDX, SNIPPET_LEN));
      // eslint-disable-next-line no-console
      console.error('getDisplayMedia.spec.preTexts:', JSON.stringify(snippets));
    }
    expect(ok).toBeTruthy();
  } else {
    // Otherwise, we succeeded in connecting or got no-stream; accept either successful connection or a benign no-stream message
    expect(/system audio connected|no stream received/i.test(statusText)).toBeTruthy();
  }
});
