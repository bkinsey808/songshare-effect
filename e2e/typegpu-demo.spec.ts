import { expect, test } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "";
const HYDRATION_WAIT_MS = 2000;
const WAIT_MULTIPLIER = 2;
const DEBUG_SNIPPET_LENGTH = 800;
const DEBUG_SNIPPET_START = 0;

test.describe("TypeGPU demo page", () => {
	test("renders and shows run button", async ({ page }) => {
		// Clear storage to avoid unexpected state
		await page.evaluate(() => {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch {
				// ignore
			}
		});

		await page.goto(`${BASE_URL}/en/typegpu-demo`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS * WAIT_MULTIPLIER);

		// Debug info: capture page HTML and screenshot for diagnosis
		const html = await page.content();
		console.warn("PAGE HTML SNIPPET:", html.slice(DEBUG_SNIPPET_START, DEBUG_SNIPPET_LENGTH));
		await page.screenshot({
			path: `test-results/typegpu-debug.png`,
			fullPage: false,
		});

		// Expect Run demo button exists
		await expect(page.getByRole("button", { name: /run demo/i })).toBeVisible();

		// Expect the TypeGPU demo heading is present
		await expect(page.getByRole("heading", { name: /typegpu demo/i })).toBeVisible();
	});
});
