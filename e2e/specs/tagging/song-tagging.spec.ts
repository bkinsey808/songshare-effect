import { expect, test, type Page } from "@playwright/test";
import { Effect } from "effect";

import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import newSenderContext from "@/e2e/specs/sharing/helpers/newSenderContext.e2e-util.ts";
import mutateTagViaApi from "@/e2e/specs/tagging/helpers/mutateTagViaApi.e2e-util.ts";
import {
	addTagInEditUi,
	expectTagInEditUi,
	expectTagNotInEditUi,
	removeTagInEditUi,
} from "@/e2e/specs/tagging/helpers/tag-edit-helpers.ts";
import {
	captureConsole,
	expectTagBadgeHidden,
	expectTagBadgeVisible,
	openViewerPage,
	waitForTagRealtimeReady,
} from "@/e2e/specs/tagging/helpers/tagging-e2e-helpers.ts";
import { getIdFromEditUrl } from "@/e2e/specs/tagging/helpers/tagging-id-helpers.ts";
import acquireBrowserContext from "@/e2e/utils/acquireBrowserContext.e2e-util.ts";
import acquirePage from "@/e2e/utils/acquirePage.e2e-util.ts";
import acquireTwoUserContexts from "@/e2e/utils/acquireTwoUserContexts.e2e-util.ts";
import clickEffect from "@/e2e/utils/clickEffect.e2e-util.ts";
import expectVisibleEffect from "@/e2e/utils/expectVisibleEffect.e2e-util.ts";
import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import fromPromiseVoid from "@/e2e/utils/fromPromiseVoid.e2e-util.ts";
import runEffect from "@/e2e/utils/runEffect.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";
import waitForResponseAndUrlAfter from "@/e2e/utils/waitForResponseAndUrlAfter.e2e-util.ts";

import {
	BASE_URL,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	missingBothSessions,
	missingSongSlug,
	testSongSlug,
} from "../sharing/helpers/sharing-constants.e2e-util.ts";

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

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Navigates to the song library and clicks "Edit" on the card that contains
 * a "View Song" link matching `testSongSlug`. Waits for the tag input to be
 * visible so callers know the form is fully loaded.
 *
 * Assumes the page is already authenticated as the song owner.
 *
 * @param ownerPage Owner page authenticated to edit songs.
 * @return Effect that resolves with the target song id.
 */
function navigateToSongEditPage(ownerPage: Page): Effect.Effect<string, Error> {
	return Effect.gen(function* navigateToSongEditPageEffect($) {
		yield* $(
			fromPromiseVoid(() =>
				ownerPage.goto(`${BASE_URL}/en/dashboard/song-library`, { waitUntil: "load" }),
			),
		);

		const viewSongLink = ownerPage.locator(`a[href*="${testSongSlug}"]`).first();
		yield* $(expectVisibleEffect(viewSongLink, { timeout: MANAGE_PAGE_READY_TIMEOUT_MS }));
		const songCard = viewSongLink.locator(
			"xpath=ancestor::div[.//button[normalize-space()='Edit']][1]",
		);

		const editBtn = songCard.getByRole("button", { name: "Edit" });
		yield* $(expectVisibleEffect(editBtn, { timeout: MANAGE_PAGE_READY_TIMEOUT_MS }));
		yield* $(clickEffect(editBtn));

		// Form is ready when the tag input is visible
		yield* $(
			expectVisibleEffect(ownerPage.getByPlaceholder("Add tags\u2026"), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		return getIdFromEditUrl(ownerPage.url(), "song");
	});
}

/**
 * Adds the test tag via the song edit UI and saves the song.
 *
 * @param ownerPage Owner page currently on the song edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function addTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* addSongTagAndSaveViaUiEffect($) {
		yield* $(
			addTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndUrlAfter({
				page: ownerPage,
				responseMatcher: /\/api\/songs\/save/,
				urlMatcher: /\/en\/dashboard\/song-library/,
				action: () => ownerPage.getByTestId("create-song-button").click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Removes the test tag via the song edit UI and saves the song.
 *
 * @param ownerPage Owner page currently on the song edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function removeTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* removeSongTagAndSaveViaUiEffect($) {
		yield* $(
			removeTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndUrlAfter({
				page: ownerPage,
				responseMatcher: /\/api\/songs\/save/,
				urlMatcher: /\/en\/dashboard\/song-library/,
				action: () => ownerPage.getByTestId("create-song-button").click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Ensures the test tag is absent from the song, saving only if a removal was
 * needed. Call in `beforeEach` to guarantee a clean starting state.
 *
 * @param ownerPage Owner page authenticated to edit songs.
 * @return Effect that resolves once the test tag is removed.
 */
function ensureTestTagAbsent(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* ensureSongTagAbsentEffect($) {
		const songId = yield* $(navigateToSongEditPage(ownerPage));
		yield* $(
			mutateTagViaApi({
				page: ownerPage,
				itemId: songId,
				itemType: "song",
				tagSlug: TEST_TAG_SLUG,
				action: "remove",
			}),
		);
	});
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("Song Tagging: Real-Time Cross-User Visibility", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingSongSlug, "Skipped: set E2E_TEST_SONG_SLUG");

	// Guarantee a clean state (no test tag) before each test.
	test.beforeEach(async ({ browser }) => {
		await runEffect(
			Effect.scoped(
				Effect.gen(function* songBeforeEachEffect($) {
					const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
					const ownerPage = yield* $(acquirePage(ownerCtx));
					yield* $(ensureTestTagAbsent(ownerPage));
				}),
			),
		);
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
		await runEffect(
			Effect.scoped(
				Effect.gen(function* songRealtimeEffect($) {
					const contexts = yield* $(acquireTwoUserContexts(() => createTwoUserContexts(browser)));
					const ownerPage = yield* $(acquirePage(contexts.senderCtx));
					const viewerPage = yield* $(acquirePage(contexts.recipientCtx));
					const errors = setupErrorTracking(viewerPage);

					const viewerConsole = captureConsole(viewerPage);

					// Viewer: open the song page and wait for auth + subscription to be ready.
					// The tag list is empty at this point (beforeEach guarantees no test tag).
					yield* $(
						openViewerPage({
							page: viewerPage,
							url: `${BASE_URL}/en/song/${testSongSlug}`,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);
					yield* $(
						waitForTagRealtimeReady({
							page: viewerPage,
							viewerConsole,
							channelLabel: "song_tag",
							timeoutMs: REALTIME_WAIT_MS,
							headingTimeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);

					// ── Step 1: owner adds the tag ──────────────────────────────────────

					const songId = yield* $(navigateToSongEditPage(ownerPage));
					yield* $(
						mutateTagViaApi({
							page: ownerPage,
							itemId: songId,
							itemType: "song",
							tagSlug: TEST_TAG_SLUG,
							action: "add",
						}),
					);

					// Viewer: the tag badge should appear in real time (no navigation)
					yield* $(expectTagBadgeVisible(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

					// ── Step 2: owner removes the tag ───────────────────────────────────

					yield* $(
						mutateTagViaApi({
							page: ownerPage,
							itemId: songId,
							itemType: "song",
							tagSlug: TEST_TAG_SLUG,
							action: "remove",
						}),
					);

					// Viewer: the tag badge should disappear in real time (no navigation)
					yield* $(expectTagBadgeHidden(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

					const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
					expect(unexpectedErrors).toHaveLength(NO_ERRORS);
				}),
			),
		);
	});

	test("owner can add and remove a tag in the edit UI and the change persists", async ({
		browser,
	}) => {
		await runEffect(
			Effect.scoped(
				Effect.gen(function* songUiEffect($) {
					const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
					const ownerPage = yield* $(acquirePage(ownerCtx));
					yield* $(navigateToSongEditPage(ownerPage));
					yield* $(addTagAndSaveViaUi(ownerPage));

					yield* $(navigateToSongEditPage(ownerPage));
					yield* $(
						expectTagInEditUi({
							page: ownerPage,
							tagSlug: TEST_TAG_SLUG,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);

					yield* $(removeTagAndSaveViaUi(ownerPage));

					yield* $(navigateToSongEditPage(ownerPage));
					yield* $(
						expectTagNotInEditUi({
							page: ownerPage,
							tagSlug: TEST_TAG_SLUG,
							timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
						}),
					);
				}),
			),
		);
	});
});
