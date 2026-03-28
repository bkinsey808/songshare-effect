import { expect, test, type Page } from "@playwright/test";
import { Effect } from "effect";

import mutateTagViaApi from "@/e2e/specs/tagging/helpers/tag-api-helpers.ts";
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
import {
	acquireBrowserContext,
	acquirePage,
	acquireTwoUserContexts,
	clickEffect,
	expectVisibleEffect,
	fromPromiseVoid,
	runEffect,
	waitForResponseAndURLAfter,
} from "@/e2e/utils/effect-test-helpers";
import { filterExpectedErrors, setupErrorTracking } from "@/e2e/utils/error-helpers";

import {
	BASE_URL,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	createTwoUserContexts,
	missingBothSessions,
	missingPlaylistSlug,
	newSenderContext,
	testPlaylistSlug,
} from "../sharing/helpers/sharing.e2e-utils.ts";

test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

const TEST_TAG_SLUG = "e2e-cross-user-tag";

/**
 * Opens the owner playlist page and navigates to edit mode.
 *
 * Returns the playlist id parsed from the edit URL.
 *
 * @param ownerPage Owner page authenticated to edit playlists.
 * @return Effect that resolves with the target playlist id.
 */
function navigateToPlaylistEditPage(ownerPage: Page): Effect.Effect<string, Error> {
	return Effect.gen(function* navigateToPlaylistEditPageEffect($) {
		yield* $(fromPromiseVoid(() => ownerPage.goto(`${BASE_URL}/en/playlist/${testPlaylistSlug}`, { waitUntil: "load" })));

		const editBtn = ownerPage.getByRole("link", { name: "Edit Playlist" });
		yield* $(expectVisibleEffect(editBtn, { timeout: MANAGE_PAGE_READY_TIMEOUT_MS }));
		yield* $(clickEffect(editBtn));

		yield* $(
			expectVisibleEffect(ownerPage.getByPlaceholder("Add tags\u2026"), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		return getIdFromEditUrl(ownerPage.url(), "playlist");
	});
}


/**
 * Adds the test tag through the edit UI and saves the playlist.
 *
 * @param ownerPage Owner page currently on the playlist edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function addTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* addPlaylistTagAndSaveViaUiEffect($) {
		yield* $(
			addTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndURLAfter({
				page: ownerPage,
				responseMatcher: /\/api\/playlists\/save/,
				urlMatcher: /\/en\/dashboard\/playlist-library/,
				action: () => ownerPage.getByTestId("save-playlist-button").click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Removes the test tag through the edit UI and saves the playlist.
 *
 * @param ownerPage Owner page currently on the playlist edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function removeTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* removePlaylistTagAndSaveViaUiEffect($) {
		yield* $(
			removeTagInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const saveResponse = yield* $(
			waitForResponseAndURLAfter({
				page: ownerPage,
				responseMatcher: /\/api\/playlists\/save/,
				urlMatcher: /\/en\/dashboard\/playlist-library/,
				action: () => ownerPage.getByTestId("save-playlist-button").click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Ensures the test tag does not exist before each test starts.
 *
 * @param ownerPage Owner page authenticated to edit playlists.
 * @return Effect that resolves once the test tag is removed.
 */
function ensureTestTagAbsent(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* ensurePlaylistTagAbsentEffect($) {
		const playlistId = yield* $(navigateToPlaylistEditPage(ownerPage));
		yield* $(
			mutateTagViaApi({
				page: ownerPage,
				itemId: playlistId,
				itemType: "playlist",
				tagSlug: TEST_TAG_SLUG,
				action: "remove",
			}),
		);
	});
}

test.describe("Playlist Tagging: Real-Time Cross-User Visibility", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingPlaylistSlug, "Skipped: set E2E_TEST_PLAYLIST_SLUG");

test.beforeEach(async ({ browser }) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* playlistBeforeEachEffect($) {
				const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
				const ownerPage = yield* $(acquirePage(ownerCtx));
				yield* $(ensureTestTagAbsent(ownerPage));
			}),
		),
	);
});

test("tags appear and disappear on the viewer's open playlist page without refresh", async ({
	browser,
}) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* playlistRealtimeEffect($) {
				const contexts = yield* $(acquireTwoUserContexts(() => createTwoUserContexts(browser)));
				const ownerPage = yield* $(acquirePage(contexts.senderCtx));
				const viewerPage = yield* $(acquirePage(contexts.recipientCtx));
				const errors = setupErrorTracking(viewerPage);

				const viewerConsole = captureConsole(viewerPage);

				yield* $(
					openViewerPage({
						page: viewerPage,
						url: `${BASE_URL}/en/playlist/${testPlaylistSlug}`,
						timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
					}),
				);
				yield* $(
					waitForTagRealtimeReady({
						page: viewerPage,
						viewerConsole,
						channelLabel: "playlist_tag",
						timeoutMs: REALTIME_WAIT_MS,
						headingTimeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
					}),
				);

				const playlistId = yield* $(navigateToPlaylistEditPage(ownerPage));
				yield* $(
					mutateTagViaApi({
						page: ownerPage,
						itemId: playlistId,
						itemType: "playlist",
						tagSlug: TEST_TAG_SLUG,
						action: "add",
					}),
				);

				yield* $(expectTagBadgeVisible(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

				yield* $(
					mutateTagViaApi({
						page: ownerPage,
						itemId: playlistId,
						itemType: "playlist",
						tagSlug: TEST_TAG_SLUG,
						action: "remove",
					}),
				);

				yield* $(expectTagBadgeHidden(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

				const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
				expect(unexpectedErrors).toHaveLength(NO_ERRORS);
			}),
		),
	);
});

test("owner can add and remove a tag in the playlist edit UI and the change persists", async ({
	browser,
}) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* playlistUiEffect($) {
				const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
				const ownerPage = yield* $(acquirePage(ownerCtx));
				yield* $(navigateToPlaylistEditPage(ownerPage));
				yield* $(addTagAndSaveViaUi(ownerPage));

				yield* $(navigateToPlaylistEditPage(ownerPage));
				yield* $(
					expectTagInEditUi({
						page: ownerPage,
						tagSlug: TEST_TAG_SLUG,
						timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
					}),
				);

				yield* $(removeTagAndSaveViaUi(ownerPage));

				yield* $(navigateToPlaylistEditPage(ownerPage));
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
