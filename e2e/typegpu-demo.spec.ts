import { expect, test } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "";
const HYDRATION_WAIT_MS = 2000;
const WAIT_MULTIPLIER = 2;
const DEBUG_SNIPPET_LENGTH = 3000;
const DEBUG_SNIPPET_START = 0;

test.describe("TypeGPU demo page", () => {
	test("runs installed TypeGPU demo without WGSL empty-struct error", async ({ page }) => {
		// Clear storage to avoid unexpected state
		await page.evaluate(() => {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch {
				// ignore
			}
		});

		const consoleMessages: string[] = [];
		page.on("console", (msg) => {
			consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
		});
		page.on("pageerror", (err) => {
			consoleMessages.push(`[pageerror] ${String(err)}`);
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

		await expect(page.getByRole("heading", { name: /typegpu demo/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /run installed typegpu/i })).toBeVisible();

		await page.getByRole("button", { name: /run installed typegpu/i }).click();
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const allLogs = consoleMessages.join("\n");
		if (
			allLogs.includes("structures must have at least one member") ||
			allLogs.includes("Error while parsing WGSL")
		) {
			console.warn(
				`TypeGPU demo encountered WGSL empty-struct error. Recent logs:\n${allLogs.slice(
					DEBUG_SNIPPET_START,
					DEBUG_SNIPPET_LENGTH,
				)}`,
			);
			throw new Error("TypeGPU demo WGSL compilation failed (see console log snippet)");
		}
	});
});
