import { expect, test } from "@playwright/test";

import { authenticateTestUser, createTestUser, mockSignedOutUser } from "./utils/auth-helpers";
import { filterExpectedErrors, setupErrorTracking } from "./utils/error-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;

test.describe("Authenticated User Features", () => {
	test("personalized greeting shows user name", async ({ page }) => {
		const customUser = createTestUser({
			name: "Jane Doe",
			email: "jane@example.com",
		});

		await authenticateTestUser(page, customUser);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByText(/jane doe/i)).toBeVisible();
	});

	test("signed-out user is redirected from dashboard to home", async ({ page }) => {
		const errors = setupErrorTracking(page);

		await mockSignedOutUser(page);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		expect(page.url()).toMatch(/\/en\/?$/);

		const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
		expect(unexpectedErrors).toHaveLength(NO_ERRORS);
	});

	test("different users see their own data", async ({ browser }) => {
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		const user1 = createTestUser({
			user_id: "user-1",
			name: "User One",
			email: "user1@example.com",
		});

		await authenticateTestUser(page1, user1);
		await page1.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page1.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page1.getByText(/user one/i)).toBeVisible();

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();

		const user2 = createTestUser({
			user_id: "user-2",
			name: "User Two",
			email: "user2@example.com",
		});

		await authenticateTestUser(page2, user2);
		await page2.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page2.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page2.getByText(/user two/i)).toBeVisible();

		await context1.close();
		await context2.close();
	});
});
