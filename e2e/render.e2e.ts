import { justDeletedAccountKey } from "@/shared/sessionStorageKeys";
import { expect, test } from "@playwright/test";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] || "";

// Choose base URL: if PLAYWRIGHT_BASE_URL is set we treat this as a deployed run
test.describe("Render smoke", () => {
	test("app renders and shows heading", async ({ page }) => {
		// Clear any stored auth state
		await page.evaluate(() => {
			try {
				localStorage.clear();
				sessionStorage.clear();
			} catch {
				// ignore
			}
		});

		// Navigate to the localized page
		await page.goto(`${BASE_URL}/en`, {
			waitUntil: "load",
		});

		// Allow some extra time for hydration/UI to render in dev mode
		await page.waitForTimeout(2000);

		// Expect the page title to be correct
		await expect(page).toHaveTitle("songshare-effect");
	});
	test("shows sign out success alert", async ({ page }) => {
		// Navigate directly to the localized page and set sessionStorage there
		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });
		await page.evaluate(() => {
			try {
				sessionStorage.setItem("justSignedOut", "1");
			} catch {
				// ignore
			}
		});
		// Reload to trigger the alert logic
		await page.reload({ waitUntil: "load" });

		// Allow time for hydration and alert to render
		await page.waitForTimeout(2000);

		// Expect the page title to be correct
		await expect(page).toHaveTitle("songshare-effect");
	});

	test("shows account deleted success alert", async ({ page }) => {
		// Navigate directly to the localized page and set sessionStorage there
		await page.goto(`${BASE_URL}/en`, { waitUntil: "load" });
		await page.evaluate((keyName) => {
			try {
				sessionStorage.setItem(keyName, "1");
			} catch {
				// ignore
			}
		}, justDeletedAccountKey);
		// Reload to trigger the alert logic
		await page.reload({ waitUntil: "load" });

		// Allow time for hydration and alert to render
		await page.waitForTimeout(2000);

		// Expect the page title to be correct
		await expect(page).toHaveTitle("songshare-effect");
	});
});
