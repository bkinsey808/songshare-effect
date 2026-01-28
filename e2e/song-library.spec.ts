import { expect, test } from "@playwright/test";

import { authenticateTestUser } from "./utils/auth-helpers";
import { filterExpectedErrors, setupErrorTracking } from "./utils/error-helpers";

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;

test.describe("Song Library Page", () => {
	test("authenticated user can access song library", async ({ page }) => {
		const errors = setupErrorTracking(page);

		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard/song-library`, { waitUntil: "load" });
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		expect(page.url()).toContain("/song-library");
		await expect(page.getByRole("heading", { name: "Song Library", exact: true })).toBeVisible();

		const unexpectedConsoleErrors = filterExpectedErrors(errors.consoleErrors);
		const unexpectedPageErrors = filterExpectedErrors(errors.pageErrors);
		expect(unexpectedConsoleErrors).toHaveLength(NO_ERRORS);
		expect(unexpectedPageErrors).toHaveLength(NO_ERRORS);
	});
});
