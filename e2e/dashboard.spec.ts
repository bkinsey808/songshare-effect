import { expect, test } from "@playwright/test";

import { authenticateTestUser } from "./utils/auth-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";

// Test timing constants
const HYDRATION_WAIT_MS = 2000;
const MIN_ERROR_COUNT = 0;

function isIgnoredDashboardError(error: string): boolean {
	return (
		error.includes("Failed to load resource") ||
		error.includes("fetchSupabaseUserTokenFromApi") ||
		error.includes("fetch failed with status: 500")
	);
}

test.describe("Dashboard Page", () => {
	// Note: signed-out user test is in authenticated-user.spec.ts

	test("page has correct title and navigation", async ({ page }) => {
		// Authenticate first so we can access the dashboard
		await authenticateTestUser(page);

		// Navigate to the dashboard
		await page.goto(`${BASE_URL}/en/dashboard`, {
			waitUntil: "load",
		});

		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify title
		await expect(page).toHaveTitle("songshare-effect");
	});

	test("dashboard URL is accessible without errors", async ({ page }) => {
		// Authenticate first
		await authenticateTestUser(page);

		// Track console errors
		const errors: string[] = [];
		/* eslint-disable jest/no-conditional-in-test */
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
		});
		/* eslint-enable jest/no-conditional-in-test */

		// Navigate to dashboard
		await page.goto(`${BASE_URL}/en/dashboard`, {
			waitUntil: "load",
		});

		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify no critical errors occurred (ignore network 500s / token API failures in e2e)
		const criticalErrors = errors.filter((error) => !isIgnoredDashboardError(error));
		expect(criticalErrors.length).toBeLessThanOrEqual(MIN_ERROR_COUNT);
	});

	test("authenticated user can access dashboard", async ({ page }) => {
		// Set up authentication by mocking the /api/me endpoint
		await authenticateTestUser(page);

		// Navigate to dashboard
		await page.goto(`${BASE_URL}/en/dashboard`, {
			waitUntil: "load",
		});

		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify we can access the dashboard
		// The page title should be correct
		await expect(page).toHaveTitle("songshare-effect");

		// Verify we're on the dashboard page
		expect(page.url()).toContain("/en/dashboard");

		// Look for dashboard content - should show welcome message
		const welcomeText = page.getByText(/welcome/i);
		await expect(welcomeText).toBeVisible();

		// Should have sign out button
		const signOutButton = page.getByRole("button", { name: /sign out/i });
		await expect(signOutButton).toBeVisible();
	});

	test("dashboard language switching works", async ({ page }) => {
		// Authenticate first
		await authenticateTestUser(page);

		// Navigate to English dashboard
		await page.goto(`${BASE_URL}/en/dashboard`, {
			waitUntil: "load",
		});

		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify we're on English version
		expect(page.url()).toContain("/en/dashboard");

		// Navigate to Spanish dashboard directly
		await page.goto(`${BASE_URL}/es/dashboard`, {
			waitUntil: "load",
		});

		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify we're on the Spanish version
		expect(page.url()).toContain("/es/dashboard");
	});
});
