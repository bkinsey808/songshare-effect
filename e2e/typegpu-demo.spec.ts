import { expect, test } from "@playwright/test";

import { setupErrorTracking } from "./utils/error-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const EXTENDED_WAIT_MS = 4000;
const NO_ERRORS = 0;

/** WGSL compilation error patterns that indicate TypeGPU failure */
const WGSL_ERROR_PATTERNS = [
	"structures must have at least one member",
	"Error while parsing WGSL",
];

test.describe("TypeGPU demo page", () => {
	test("runs installed TypeGPU demo without WGSL errors", async ({ page }) => {
		const errors = setupErrorTracking(page);

		const allMessages: string[] = [];
		page.on("console", (msg) => {
			allMessages.push(`[${msg.type()}] ${msg.text()}`);
		});

		await page.evaluate(() => {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch {
				// ignore
			}
		});

		await page.goto(`${BASE_URL}/en/typegpu-demo`, { waitUntil: "load" });
		await page.waitForTimeout(EXTENDED_WAIT_MS);

		await expect(page.getByRole("heading", { name: /typegpu demo/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /run installed typegpu/i })).toBeVisible();

		await page.getByRole("button", { name: /run installed typegpu/i }).click();
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const allLogs = allMessages.join("\n");
		const hasWgslError = WGSL_ERROR_PATTERNS.some((pattern) => allLogs.includes(pattern));

		expect(hasWgslError, "TypeGPU demo should not have WGSL compilation errors").toBe(false);
		expect(errors.pageErrors).toHaveLength(NO_ERRORS);
	});
});
