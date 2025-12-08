import { expect, test } from "@playwright/test";

import {
	authenticateTestUser,
	createTestUser,
	mockSignedOutUser,
} from "./utils/auth-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;

test.describe("Authenticated User Features", () => {
	test("authenticated user can access dashboard", async ({ page }) => {
		// Set up authentication
		await authenticateTestUser(page);

		// Navigate to dashboard
		await page.goto(`${BASE_URL}/en/dashboard`);
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify dashboard is accessible
		expect(page.url()).toContain("/en/dashboard");
		await expect(page.getByText(/welcome/i)).toBeVisible();
	});

	test("authenticated user with custom name sees personalized greeting", async ({ page }) => {
		// Create a custom test user
		const customUser = createTestUser({
			name: "Jane Doe",
			email: "jane@example.com",
		});

		// Authenticate with custom user
		await authenticateTestUser(page, customUser);

		// Navigate to dashboard
		await page.goto(`${BASE_URL}/en/dashboard`);
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify personalized greeting
		await expect(page.getByText(/jane doe/i)).toBeVisible();
	});

	test("signed-out user is redirected from dashboard to home", async ({ page }) => {
		// Mock signed-out state
		await mockSignedOutUser(page);

		// Try to access dashboard
		await page.goto(`${BASE_URL}/en/dashboard`);
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Should be redirected to home
		expect(page.url()).toMatch(/\/en\/?$/);
	});

	test("authenticated user can access song library", async ({ page }) => {
		await authenticateTestUser(page);

		// Navigate to song library
		await page.goto(`${BASE_URL}/en/dashboard/song-library`);
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		// Should be on song library page
		expect(page.url()).toContain("/song-library");
	});

	test("different users see their own data", async ({ browser }) => {
		// Create two separate browser contexts to simulate two different users
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		const user1 = createTestUser({
			user_id: "user-1",
			name: "User One",
			email: "user1@example.com",
		});

		await authenticateTestUser(page1, user1);
		await page1.goto(`${BASE_URL}/en/dashboard`);
		await page1.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify first user's name
		await expect(page1.getByText(/user one/i)).toBeVisible();

		// Second user in separate context
		const context2 = await browser.newContext();
		const page2 = await context2.newPage();

		const user2 = createTestUser({
			user_id: "user-2",
			name: "User Two",
			email: "user2@example.com",
		});

		await authenticateTestUser(page2, user2);
		await page2.goto(`${BASE_URL}/en/dashboard`);
		await page2.waitForTimeout(HYDRATION_WAIT_MS);

		// Verify second user's name
		await expect(page2.getByText(/user two/i)).toBeVisible();

		// Clean up
		await context1.close();
		await context2.close();
	});
});
