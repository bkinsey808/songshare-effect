import { expect, test } from "@playwright/test";

import { ALERT_TYPES } from "./utils/translation-helpers";
import { justDeletedAccountKey } from "@/shared/sessionStorageKeys";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] || "";

// Choose base URL: if PLAYWRIGHT_BASE_URL is set we treat this as a deployed run
test.describe("Render smoke", () => {
	test("app renders and shows heading", async ({ page }) => {
		// Navigate to root and wait for load (app may redirect)
		await page.goto(BASE_URL, {
			waitUntil: "load",
		});

		// Allow some extra time for hydration/UI to render in dev mode
		await page.waitForTimeout(500);

		// Expect the main heading or any h2 to be visible
		const heading = page
			.locator("h1, h2, [data-testid='main-title'], main")
			.first();
		await expect(heading).toBeVisible({ timeout: 20000 });
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
		await page.waitForTimeout(1000);

		// Test using data-testid and data attributes instead of text content
		const alertContainer = page.getByTestId("dismissible-alert");
		await expect(alertContainer).toBeVisible({ timeout: 10000 });

		// Verify this is specifically the sign out alert
		await expect(alertContainer).toHaveAttribute(
			"data-alert-type",
			ALERT_TYPES.SIGN_OUT_SUCCESS,
		);

		// Check that the alert has the success variant
		await expect(alertContainer).toHaveAttribute("data-variant", "success");

		// Check that the alert title is present
		const alertTitle = page.getByTestId("alert-title");
		await expect(alertTitle).toBeVisible({ timeout: 8000 });

		// Check that the alert message is present
		const alertMessage = page.getByTestId("alert-message");
		await expect(alertMessage).toBeVisible({ timeout: 8000 });

		// Ensure the alert remains visible for a short while (it should not auto-dismiss)
		await page.waitForTimeout(500);
		await expect(alertContainer).toBeVisible();

		// Dismiss the alert and verify it disappears and the URL is clean
		const dismissButton = page.getByTestId("alert-dismiss-button");
		await expect(dismissButton).toBeVisible({ timeout: 5000 });
		await dismissButton.click();

		// Alert should be hidden after dismissal
		await expect(alertContainer).toBeHidden({ timeout: 5000 });

		// URL should not contain the one-time query param after dismissal
		const search = await page.evaluate(() => window.location.search);
		expect(search).not.toContain("justSignedOut");
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
		await page.waitForTimeout(1000);

		// Test using data-testid and data attributes instead of text content
		const alertContainer = page.getByTestId("dismissible-alert");
		await expect(alertContainer).toBeVisible({ timeout: 15000 });

		// Verify this is specifically the account deleted alert
		await expect(alertContainer).toHaveAttribute(
			"data-alert-type",
			ALERT_TYPES.DELETE_SUCCESS,
		);

		// Check that the alert has the success variant
		await expect(alertContainer).toHaveAttribute("data-variant", "success");

		// Check that the alert title is present
		const alertTitle = page.getByTestId("alert-title");
		await expect(alertTitle).toBeVisible({ timeout: 10000 });

		// Check that the alert message is present
		const alertMessage = page.getByTestId("alert-message");
		await expect(alertMessage).toBeVisible({ timeout: 10000 });

		// Dismiss the alert
		const dismissButton = page.getByTestId("alert-dismiss-button");
		await expect(dismissButton).toBeVisible({ timeout: 5000 });
		await dismissButton.click();
		await expect(alertContainer).toBeHidden({ timeout: 5000 });

		const search2 = await page.evaluate(() => window.location.search);
		expect(search2).not.toContain("deleted");
	});
});
