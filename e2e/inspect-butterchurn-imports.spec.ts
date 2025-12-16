/* eslint-disable no-console, @typescript-eslint/no-explicit-any, no-empty */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;

// Experiment: dynamically import different module entrypoints in the browser
// and capture their export shapes/errors so we can determine a feasible import strategy.
test("butterchurn import shapes (dynamic import experiment)", async ({ page }) => {
  await page.goto(`${BASE_URL}/en/butterchurn-demo`, { waitUntil: "load" });
  await page.waitForTimeout(HYDRATION_WAIT_MS);

  // Load the ESM debug module served by Vite so imports are resolved by the dev server
  await page.evaluate(() => {
    const tag = document.createElement('script');
    tag.type = 'module';
    tag.src = '/react/src/butterchurn/import-debug.ts';
    document.head.append(tag);
  });

  // Wait for the debug module to populate the global result
  const results = await page.waitForFunction(() => (globalThis as any).__butterchurn_import_debug, {}, { timeout: 10_000 }).then(() => page.evaluate(() => (globalThis as any).__butterchurn_import_debug));

  console.log('butterchurn import experiment results (via module):', results);

  const globalState = await page.evaluate(() => ({
    hasGlobal: !!(globalThis as any).butterchurn,
    hasLibSlot: !!(globalThis as any).__butterchurn_lib,
  }));
  console.log('global state after module import:', globalState);

  // Ensure the experiment ran and returned at least the attempted specs
  // eslint-disable-next-line no-magic-numbers
  expect(Array.isArray(results) && results.length > 0).toBeTruthy();
  expect(typeof globalState.hasGlobal === 'boolean').toBeTruthy();
});