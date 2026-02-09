import { expect, test } from "@playwright/test";

import { justDeletedAccountKey, justSignedOutKey } from "@/shared/sessionStorageKeys";

import { filterExpectedErrors, setupErrorTracking } from "../utils/error-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;

test.describe("Render smoke", () => {
	test("app renders without errors", async ({ page }) => {
		const errors = setupErrorTracking(page);

		await page.evaluate(() => {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch {
				// ignore
			}
		});

		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page).toHaveTitle("songshare-effect");

		const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
		expect(unexpectedErrors).toHaveLength(NO_ERRORS);
	});

	test("shows sign out success alert", async ({ page }) => {
		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });

		await page.evaluate((key) => {
			try {
				sessionStorage.setItem(key, "1");
			} catch {
				// ignore
			}
		}, justSignedOutKey);

		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByTestId("alert-title")).toHaveText(/signed out/i);
		await expect(page.getByTestId("alert-message")).toHaveText(/successfully signed out/i);
	});

	test("shows account deleted success alert", async ({ page }) => {
		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });

		await page.evaluate((key) => {
			try {
				sessionStorage.setItem(key, "1");
			} catch {
				// ignore
			}
		}, justDeletedAccountKey);

		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByText(/account deleted/i)).toBeVisible();
		await expect(page.getByText(/permanently deleted/i)).toBeVisible();
	});
});
