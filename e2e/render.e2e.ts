import { expect, test } from "@playwright/test";

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

		// Check if any alert is visible by looking for the alert container
		const alertContainer = page.locator(".rounded-md.p-4.text-center");
		await expect(alertContainer).toBeVisible({ timeout: 10000 });

		// Check if the sign out success alert is visible by looking for the title
		const alertTitle = page.locator("strong").filter({ hasText: "Signed Out" });
		await expect(alertTitle).toBeVisible({ timeout: 8000 });

		// Check if the alert contains the expected message (more flexible for WebKit)
		const message = page.getByText("You have been successfully signed out.", {
			exact: false,
		});
		await expect(message).toBeVisible({ timeout: 8000 });

		// Ensure the alert remains visible for a short while (it should not auto-dismiss)
		await page.waitForTimeout(500);
		await expect(alertContainer).toBeVisible();

		// Dismiss the alert and verify it disappears and the URL is clean
		const dismissButton = alertContainer
			.locator('button:has-text("Dismiss")')
			.first();
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

		const alertContainer = page.locator(".rounded-md.p-4.text-center");
		await expect(alertContainer).toBeVisible({ timeout: 15000 });

		const alertTitle = page
			.locator("strong")
			.filter({ hasText: "Account Deleted" });
		await expect(alertTitle).toBeVisible({ timeout: 10000 });

		const message = page.getByText(
			"Your account has been successfully deleted.",
			{ exact: false },
		);
		await expect(message).toBeVisible({ timeout: 10000 });

		// Dismiss the alert
		const dismissButton = alertContainer
			.locator('button:has-text("Dismiss")')
			.first();
		await expect(dismissButton).toBeVisible({ timeout: 5000 });
		await dismissButton.click();
		await expect(alertContainer).toBeHidden({ timeout: 5000 });

		const search2 = await page.evaluate(() => window.location.search);
		expect(search2).not.toContain("deleted");
	});
});
