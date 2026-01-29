import { expect, test } from "@playwright/test";

import { authenticateTestUser } from "../utils/auth-helpers";
import { filterExpectedErrors, setupErrorTracking } from "../utils/error-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;

test.describe("Dashboard Page", () => {
	test("dashboard is accessible without errors", async ({ page }) => {
		await authenticateTestUser(page);
		const errors = setupErrorTracking(page);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page).toHaveTitle("songshare-effect");
		expect(page.url()).toContain("/en/dashboard");

		const unexpectedConsoleErrors = filterExpectedErrors(errors.consoleErrors);
		const unexpectedPageErrors = filterExpectedErrors(errors.pageErrors);
		expect(unexpectedConsoleErrors).toHaveLength(NO_ERRORS);
		expect(unexpectedPageErrors).toHaveLength(NO_ERRORS);
	});

	test("dashboard shows welcome message and sign out button", async ({ page }) => {
		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		await expect(page.getByText(/welcome/i)).toBeVisible();
		await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
	});

	test("dashboard language switching shows localized content", async ({ page }) => {
		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);
		expect(page.url()).toContain("/en/dashboard");
		await expect(page.getByText(/welcome/i)).toBeVisible();

		await page.goto(`${BASE_URL}/es/dashboard`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);
		expect(page.url()).toContain("/es/dashboard");
		await expect(page.getByText(/bienvenido/i)).toBeVisible();
	});
});
