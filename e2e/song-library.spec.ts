import { expect, test, type ConsoleMessage } from "@playwright/test";

import { authenticateTestUser } from "./utils/auth-helpers";

function recordConsoleError(errors: string[], message: ConsoleMessage): void {
	if (message.type() === "error") {
		errors.push(message.text());
	}
}

function filterExpectedAuthErrors(errors: readonly string[]): string[] {
	const expectedErrorPatterns = [
		"visitor token",
		"Not allowed to request resource",
		"Unable to authenticate as visitor",
		"fetchLibrary",
		"subscribeToLibrary",
		"access control checks",
		"/api/auth/visitor",
		"Cookie",
		"invalid domain",
		"__cf_bm",
	];

	return errors.filter(
		(error) => !expectedErrorPatterns.some((pattern) => error.includes(pattern)),
	);
}

const BASE_URL = process.env?.["PLAYWRIGHT_BASE_URL"] ?? "https://localhost:5173";
const HYDRATION_WAIT_MS = 2000;
const NO_ERRORS = 0;

test.describe("Song Library Page", () => {
	test("authenticated user can access song library", async ({ page }) => {
		const consoleErrors: string[] = [];
		const pageErrors: string[] = [];

		page.on("console", (message) => {
			recordConsoleError(consoleErrors, message);
		});

		page.on("pageerror", (error) => {
			pageErrors.push(error.message);
		});

		await authenticateTestUser(page);

		await page.goto(`${BASE_URL}/en/dashboard/song-library`);
		await page.waitForTimeout(HYDRATION_WAIT_MS);

		expect(page.url()).toContain("/song-library");

		// Print errors before asserting visibility so we can see what went wrong
		console.error("Console errors:", consoleErrors);
		console.error("Page errors:", pageErrors);

		// Check for the main "Song Library" heading - use exact match to avoid matching "Your song library is empty"
		await expect(page.getByRole("heading", { name: "Song Library", exact: true })).toBeVisible();

		// Filter out expected auth errors in test environment (visitor token CORS issues)
		const unexpectedErrors = filterExpectedAuthErrors(consoleErrors);
		const unexpectedPageErrors = filterExpectedAuthErrors(pageErrors);

		expect(unexpectedErrors, "no unexpected console.error messages").toHaveLength(NO_ERRORS);
		expect(unexpectedPageErrors, "no uncaught page errors").toHaveLength(NO_ERRORS);
	});
});
