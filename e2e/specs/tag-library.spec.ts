import { type Page, expect, test } from "@playwright/test";

import { authenticateTestUser } from "../utils/auth-helpers";
import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;
const FAKE_SUPABASE_TOKEN = "fake-supabase-token-for-testing";
const FAKE_TOKEN_EXPIRES_IN = 3600;

/**
 * Mocks the Supabase user token API so the app can construct a Supabase client,
 * then mocks the tag_library REST endpoint with the provided rows.
 */
const TEST_USER_ID = "test-user-id-12345";

function tagRows(...slugs: string[]): { user_id: string; tag_slug: string }[] {
	return slugs.map((tag_slug) => ({ user_id: TEST_USER_ID, tag_slug }));
}

async function mockTagLibraryData(
	page: Page,
	rows: { user_id: string; tag_slug: string }[],
): Promise<void> {
	await page.route("**/api/auth/user/token", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: { access_token: FAKE_SUPABASE_TOKEN, expires_in: FAKE_TOKEN_EXPIRES_IN },
			}),
		});
	});
	await page.route("**/rest/v1/tag_library**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(rows),
		});
	});
}

test.describe("Tag Library Page", () => {
	test("authenticated user can access tag library page", async ({ page }) => {
		const errors = setupErrorTracking(page);

		await authenticateTestUser(page);
		await mockTagLibraryData(page, []);

		await page.goto(`${BASE_URL}/en/dashboard/tag-library`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		expect(page.url()).toContain("/tag-library");
		await expect(page.getByRole("heading", { name: "Tag Library", exact: true })).toBeVisible();

		const unexpectedConsoleErrors = filterExpectedErrors(errors.consoleErrors);
		const unexpectedPageErrors = filterExpectedErrors(errors.pageErrors);
		expect(unexpectedConsoleErrors).toHaveLength(NO_ERRORS);
		expect(unexpectedPageErrors).toHaveLength(NO_ERRORS);
	});

	test("tag library shows empty state when user has no tags", async ({ page }) => {
		await authenticateTestUser(page);
		await mockTagLibraryData(page, []);

		await page.goto(`${BASE_URL}/en/dashboard/tag-library`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByRole("heading", { name: "No tags yet" })).toBeVisible();
	});

	test("tag library shows user tags when they exist", async ({ page }) => {
		await authenticateTestUser(page);
		await mockTagLibraryData(page, tagRows("indie-rock", "worship-2024"));

		await page.goto(`${BASE_URL}/en/dashboard/tag-library`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByText("indie-rock")).toBeVisible();
		await expect(page.getByText("worship-2024")).toBeVisible();
		await expect(page.getByText("2 tags")).toBeVisible();
	});

	test("tag library is accessible via navigation menu", async ({ page }) => {
		await authenticateTestUser(page);
		await mockTagLibraryData(page, []);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		const tagNavLink = page.getByTestId("navigation-tag-library");
		await expect(tagNavLink).toBeVisible();
	});
});

test.describe("Tag View Page", () => {
	test("authenticated user can access a tag view page", async ({ page }) => {
		const errors = setupErrorTracking(page);

		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard/tag/indie-rock`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		expect(page.url()).toContain("/tag/indie-rock");
		await expect(page.getByRole("heading", { name: "indie-rock", exact: true })).toBeVisible();

		const unexpectedConsoleErrors = filterExpectedErrors(errors.consoleErrors);
		const unexpectedPageErrors = filterExpectedErrors(errors.pageErrors);
		expect(unexpectedConsoleErrors).toHaveLength(NO_ERRORS);
		expect(unexpectedPageErrors).toHaveLength(NO_ERRORS);
	});
});
