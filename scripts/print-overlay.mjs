import { chromium } from 'playwright';

const OVERLAY_WAIT_MS = 1500;
const OVERLAY_TEXT_SLICE = 1000;
const OVERLAY_INNER_SLICE = 5000;
const JSON_SPACES = 2;

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    await page.goto('https://127.0.0.1:5173/en/butterchurn-demo', { waitUntil: 'load', timeout: 15_000 });
    await page.waitForTimeout(OVERLAY_WAIT_MS);
    const overlayInner = await page.evaluate(() => document.querySelector('vite-error-overlay')?.innerHTML);
    const overlayNodes = await page.evaluate(() => [...document.querySelectorAll('vite-error-overlay *')].map((el) => ({ tag: el.tagName, cls: el.className, text: (el.textContent || '').trim().slice(undefined, OVERLAY_TEXT_SLICE) })));
    console.error('overlayInner:', String(overlayInner).slice(undefined, OVERLAY_INNER_SLICE));
    console.error('overlayNodes:', JSON.stringify(overlayNodes, undefined, JSON_SPACES));
  } catch (error) {
    console.error('error while fetching overlay:', error);
  } finally {
    await browser.close();
  }
} catch (error) {
  console.error('print-overlay failed:', error);
}