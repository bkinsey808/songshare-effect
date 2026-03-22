import { expect, type Page, test } from "@playwright/test";

import { filterExpectedErrors, setupErrorTracking } from "@/e2e/utils/error-helpers";

import {
	BASE_URL,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	createTwoUserContexts,
	missingBothSessions,
	missingSongSlug,
	newSenderContext,
	testSongSlug,
} from "../sharing/sharing.e2e-utils.ts";

// These tests use real shared accounts on staging/local DB and MUST NOT run in parallel
// across multiple workers. Even with 'serial' mode, different browser projects
// will collide. RUN WITH: --workers=1
test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

// ── constants ─────────────────────────────────────────────────────────────────

/**
 * Tag slug used exclusively by these tests. Unique enough to avoid colliding
 * with any legitimate user tags in the staging DB.
 */
const TEST_TAG_SLUG = "e2e-cross-user-tag";

/**
 * Maximum time to wait for the /api/songs/save response after clicking
 * "Update Song". Includes wrangler cold-start on the first request.
 */
const SAVE_TIMEOUT_MS = 60_000;

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Navigates to the song library and clicks "Edit" on the card that contains
 * a "View Song" link matching `testSongSlug`. Waits for the tag input to be
 * visible so callers know the form is fully loaded.
 *
 * Assumes the page is already authenticated as the song owner.
 */
async function navigateToSongEditPage(ownerPage: Page): Promise<void> {
	await ownerPage.goto(`${BASE_URL}/en/dashboard/song-library`, { waitUntil: "load" });

	// Locate the specific song card via its "View Song" link href
	const songCard = ownerPage
		.locator("div")
		.filter({ has: ownerPage.locator(`a[href*="${testSongSlug}"]`) })
		.first();

	const editBtn = songCard.getByRole("button", { name: "Edit" });
	await expect(editBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
	await editBtn.click();

	// Form is ready when the tag input is visible
	await expect(ownerPage.getByPlaceholder("Add tags\u2026")).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
}

/**
 * Adds the test tag via the song edit form and saves.
 * Assumes the page is already on the song edit form.
 */
async function addTagAndSave(ownerPage: Page): Promise<void> {
	const tagInput = ownerPage.getByPlaceholder("Add tags\u2026");
	await tagInput.fill(TEST_TAG_SLUG);
	await tagInput.press("Enter");
	await expect(ownerPage.getByLabel(`Remove tag ${TEST_TAG_SLUG}`)).toBeVisible();

	const saveP = ownerPage.waitForResponse(/\/api\/songs\/save/, { timeout: SAVE_TIMEOUT_MS });
	await ownerPage.getByTestId("create-song-button").click();
	const saveResponse = await saveP;
	expect(saveResponse.ok()).toBe(true);
}

/**
 * Removes the test tag via the song edit form and saves.
 * Assumes the page is already on the song edit form and the tag badge is visible.
 */
async function removeTagAndSave(ownerPage: Page): Promise<void> {
	const removeBtn = ownerPage.getByLabel(`Remove tag ${TEST_TAG_SLUG}`);
	await expect(removeBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
	await removeBtn.click();
	await expect(removeBtn).not.toBeVisible();

	const saveP = ownerPage.waitForResponse(/\/api\/songs\/save/, { timeout: SAVE_TIMEOUT_MS });
	await ownerPage.getByTestId("create-song-button").click();
	const saveResponse = await saveP;
	expect(saveResponse.ok()).toBe(true);
}

/**
 * Ensures the test tag is absent from the song, saving only if a removal was
 * needed. Call in `beforeEach` to guarantee a clean starting state.
 */
async function ensureTestTagAbsent(ownerPage: Page): Promise<void> {
	await navigateToSongEditPage(ownerPage);

	const removeBtn = ownerPage.getByLabel(`Remove tag ${TEST_TAG_SLUG}`);
	if (!(await removeBtn.isVisible())) {
		return;
	}

	await removeBtn.click();
	await expect(removeBtn).not.toBeVisible();

	const saveP = ownerPage.waitForResponse(/\/api\/songs\/save/, { timeout: SAVE_TIMEOUT_MS });
	await ownerPage.getByTestId("create-song-button").click();
	const saveResponse = await saveP;
	expect(saveResponse.ok()).toBe(true);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("Song Tagging: Real-Time Cross-User Visibility", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingSongSlug, "Skipped: set E2E_TEST_SONG_SLUG");

	// Guarantee a clean state (no test tag) before each test.
	test.beforeEach(async ({ browser }) => {
		const ownerCtx = await newSenderContext(browser);
		const ownerPage = await ownerCtx.newPage();
		try {
			await ensureTestTagAbsent(ownerPage);
		} finally {
			await ownerCtx.close();
		}
	});

	/**
	 * Full real-time lifecycle test.
	 *
	 * The viewer's page stays open throughout. Tags added or removed by the
	 * owner are pushed via a Supabase Realtime postgres_changes subscription
	 * (useItemTagsDisplay) and reflected in the viewer's UI without any
	 * navigation or reload.
	 *
	 * Flow:
	 *   1. Viewer opens the song page (no tags yet).
	 *   2. Owner adds the tag and saves.
	 *   3. Viewer's open page shows the tag appear in real time.
	 *   4. Owner removes the tag and saves.
	 *   5. Viewer's open page shows the tag disappear in real time.
	 */
	test("tags appear and disappear on the viewer's open page without refresh", async ({
		browser,
	}) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const ownerPage = await senderCtx.newPage();
			const viewerPage = await recipientCtx.newPage();
			const errors = setupErrorTracking(viewerPage);

			// Viewer: open the song page and wait for auth + subscription to be ready.
			// The tag list is empty at this point (beforeEach guarantees no test tag).
			await viewerPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			await expect(viewerPage.getByRole("heading").first()).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});

			// ── Step 1: owner adds the tag ──────────────────────────────────────

			await navigateToSongEditPage(ownerPage);
			await addTagAndSave(ownerPage);

			// Viewer: the tag badge should appear in real time (no navigation)
			await expect(viewerPage.getByLabel(`View tag ${TEST_TAG_SLUG}`)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

			// ── Step 2: owner removes the tag ───────────────────────────────────

			await navigateToSongEditPage(ownerPage);
			await removeTagAndSave(ownerPage);

			// Viewer: the tag badge should disappear in real time (no navigation)
			await expect(viewerPage.getByLabel(`View tag ${TEST_TAG_SLUG}`)).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});
