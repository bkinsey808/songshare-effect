import { type ConsoleMessage, type Page } from "@playwright/test";

/** Common error patterns to ignore in e2e tests (network/auth issues in test environment) */
const EXPECTED_ERROR_PATTERNS = [
	"Failed to load resource",
	"fetchSupabaseUserTokenFromApi",
	"fetch failed with status: 500",
	"visitor token",
	"Not allowed to request resource",
	"Unable to authenticate as visitor",
	"fetchSongLibrary",
	"subscribeToSongLibrary",
	// Supabase Realtime JWT verification failures — infrastructure/config issue in
	// staging-db mode, not a code bug. App falls back to fetch-only updates.
	// Chromium serializes the error class name ("JwtSignerError"), Firefox just says "Error".
	"subscribeToPendingInvitations",
	"JwtSignerError",
	"[song_library] Channel error",
	"[tag_library] Channel error",
	"[song_tag] Channel error",
	"[playlist_tag] Channel error",
	"[event_tag] Channel error",
	"[community_tag] Channel error",
	"[image_tag] Channel error",
	"Failed to load shares",
	"[share_public] Channel error",
	"access control checks",
	"/api/auth/visitor",
	"Cookie",
	"invalid domain",
	"__cf_bm",
	"Failed to request wake lock",
];

/**
 * Filters out expected/known errors from an error list.
 *
 * @param errors - array of error messages
 * @returns filtered array with only unexpected errors
 */
export function filterExpectedErrors(errors: readonly string[]): string[] {
	return errors.filter(
		(error) => !EXPECTED_ERROR_PATTERNS.some((pattern) => error.includes(pattern)),
	);
}

/** Console error collector for use with page.on("console") */
export type ErrorCollector = {
	consoleErrors: string[];
	pageErrors: string[];
};

/**
 * Sets up console and page error tracking on a Playwright page.
 *
 * @param page - Playwright page object
 * @returns ErrorCollector with arrays that populate as errors occur
 *
 * @example
 * ```ts
 * const errors = setupErrorTracking(page);
 * await page.goto(url);
 * const unexpected = filterExpectedErrors(errors.consoleErrors);
 * expect(unexpected).toHaveLength(0);
 * ```
 */
/* oxlint-disable jest/no-conditional-in-test */
export function setupErrorTracking(page: Page): ErrorCollector {
	const collector: ErrorCollector = {
		consoleErrors: [],
		pageErrors: [],
	};

	page.on("console", (msg: ConsoleMessage) => {
		if (msg.type() === "error") {
			collector.consoleErrors.push(msg.text());
		}
	});

	page.on("pageerror", (error: Error) => {
		collector.pageErrors.push(error.message);
	});

	return collector;
}
/* oxlint-enable jest/no-conditional-in-test */
