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
	expectTagBadgeHidden,
	expectTagBadgeVisible,
	openViewerPage,
} from "@/e2e/specs/tagging/helpers/tagging-e2e-helpers.ts";
import { extractIdFromPublicRows } from "@/e2e/specs/tagging/helpers/tagging-id-helpers.ts";
import {
	acquireBrowserContext,
	acquirePage,
	acquireTwoUserContexts,
	expectHiddenEffect,
	expectVisibleEffect,
	fromPromise,
	fromPromiseVoid,
	runEffect,
	waitForResponseAfter,
	waitForResponseAndURLAfter,
} from "@/e2e/utils/effect-test-helpers";
import { filterExpectedErrors, setupErrorTracking } from "@/e2e/utils/error-helpers";
import { dashboardPath, eventEditPath } from "@/shared/paths";

import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	clearAllPendingPeerShares,
	createTwoUserContexts,
	ensureUserNotInEvent,
	missingBothSessions,
	missingEventSlug,
	missingUser2Username,
	newRecipientContext,
	newSenderContext,
	selectUserInSearch,
	testEventSlug,
	testUser2Username,
} from "../sharing/helpers/sharing.e2e-utils.ts";

test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

const TEST_TAG_SLUG = "e2e-cross-user-tag";
const EVENT_TAG_SUBSCRIBE_SETTLE_MS = 2000;

/**
 * Opens the owner event page and navigates to the edit route.
 *
 * Returns the resolved event id used by edit and tag APIs.
 *
 * @param ownerPage Owner page authenticated to edit events.
 * @return Effect that resolves with the target event id.
 */
function navigateToEventEditPage(ownerPage: Page): Effect.Effect<string, Error> {
	return Effect.gen(function* navigateToEventEditPageEffect($) {
		const eventPublicResponse = yield* $(
			waitForResponseAfter({
				page: ownerPage,
				responseMatcher: (response) =>
					response.url().includes("/event_public") &&
					response.url().includes(testEventSlug) &&
					response.request().method() === "GET",
				action: () => ownerPage.goto(`${BASE_URL}/en/event/${testEventSlug}`, { waitUntil: "load" }),
				options: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		yield* $(
			expectVisibleEffect(ownerPage.getByRole("heading").first(), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		const eventPublicRows: unknown = yield* $(fromPromise(() => eventPublicResponse.json()));
		const eventId = extractIdFromPublicRows(eventPublicRows, "event_id");

		if (eventId === undefined) {
			return yield* $(Effect.fail(new Error(`Could not determine event id for slug: ${testEventSlug}`)));
		}

		yield* $(
			fromPromiseVoid(() =>
				ownerPage.goto(`${BASE_URL}/en/${dashboardPath}/${eventEditPath}/${eventId}`, {
					waitUntil: "load",
				}),
			),
		);

		yield* $(
			expectVisibleEffect(ownerPage.getByPlaceholder("Add tags\u2026"), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);

		return eventId;
	});
}


/**
 * Adds the test tag through the edit UI and saves the event.
 *
 * @param ownerPage Owner page currently on the event edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function addTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* addEventTagAndSaveViaUiEffect($) {
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
				responseMatcher: /\/api\/events\/save/,
				urlMatcher: new RegExp(`/en/event/${testEventSlug}$`),
				action: () => ownerPage.getByRole("button", { name: /save/i }).click(),
				responseOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
				urlOptions: { timeout: MANAGE_PAGE_READY_TIMEOUT_MS },
			}),
		);
		expect(saveResponse.ok()).toBe(true);
	});
}

/**
 * Removes the test tag through the edit UI and saves the event.
 *
 * @param ownerPage Owner page currently on the event edit screen.
 * @return Effect that resolves after save succeeds and navigation completes.
 */
function removeTagAndSaveViaUi(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* removeEventTagAndSaveViaUiEffect($) {
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
				responseMatcher: /\/api\/events\/save/,
				urlMatcher: new RegExp(`/en/event/${testEventSlug}$`),
				action: () => ownerPage.getByRole("button", { name: /save/i }).click(),
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
 * @param ownerPage Owner page authenticated to edit events.
 * @return Effect that resolves once the test tag is removed.
 */
function ensureTestTagAbsent(ownerPage: Page): Effect.Effect<void, Error> {
	return Effect.gen(function* ensureEventTagAbsentEffect($) {
		const eventId = yield* $(navigateToEventEditPage(ownerPage));
		yield* $(
			mutateTagViaApi({
				page: ownerPage,
				itemId: eventId,
				itemType: "event",
				tagSlug: TEST_TAG_SLUG,
				action: "remove",
			}),
		);
	});
}

/**
 * Invites user 2 and accepts the invite so the viewer can access the event page.
 *
 * @param ownerPage Event owner page used to issue invites.
 * @param recipientPage Recipient page used to accept invites.
 * @return Effect that resolves once recipient access is established.
 */
function ensureRecipientCanAccessEvent(
	ownerPage: Page,
	recipientPage: Page,
): Effect.Effect<void, Error> {
	return Effect.gen(function* ensureRecipientCanAccessEventEffect($) {
		yield* $(
			fromPromiseVoid(() =>
				ownerPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
					waitUntil: "load",
				}),
			),
		);
		yield* $(
			expectVisibleEffect(ownerPage.getByLabel("Invite User (username or id)"), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);
		yield* $(fromPromiseVoid(() => selectUserInSearch(ownerPage, "Invite User (username or id)", testUser2Username)));
		const inviteResponse = yield* $(
			waitForResponseAfter({
				page: ownerPage,
				responseMatcher: /\/api\/event-user\/add/,
				action: () => ownerPage.getByRole("button", { name: "Invite Participant" }).click(),
				options: { timeout: INVITE_SUCCESS_TIMEOUT_MS },
			}),
		);
		expect(inviteResponse.ok()).toBe(true);
		yield* $(
			expectVisibleEffect(ownerPage.getByText(/participant invited/i), {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			}),
		);

		yield* $(fromPromiseVoid(() => recipientPage.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" })));
		yield* $(
			expectVisibleEffect(recipientPage.getByText(/pending invitations/i), {
				timeout: REALTIME_WAIT_MS,
			}),
		);
		const joinResponse = yield* $(
			waitForResponseAfter({
				page: recipientPage,
				responseMatcher: /\/api\/event-user\/join/,
				action: () => recipientPage.getByRole("button", { name: "Accept", exact: true }).first().click(),
				options: { timeout: INVITE_SUCCESS_TIMEOUT_MS },
			}),
		);
		expect(joinResponse.ok()).toBe(true);
		yield* $(
			expectHiddenEffect(recipientPage.getByRole("button", { name: "Accept", exact: true }).first(), {
				timeout: REALTIME_WAIT_MS,
			}),
		);
	});
}

/**
 * Reopens edit mode and asserts whether the remove-tag button should be visible.
 *
 * @param ownerPage Owner page authenticated to edit events.
 * @param visible Expected visibility for the remove-tag button.
 * @return Effect that resolves once the expected UI state is observed.
 */
function expectOwnerEditTagState(
	ownerPage: Page,
	visible: boolean,
): Effect.Effect<void, Error> {
	return Effect.gen(function* expectOwnerEditTagStateEffect($) {
		yield* $(navigateToEventEditPage(ownerPage));
		if (visible) {
			yield* $(
				expectTagInEditUi({
					page: ownerPage,
					tagSlug: TEST_TAG_SLUG,
					timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
				}),
			);
			return;
		}

		yield* $(
			expectTagNotInEditUi({
				page: ownerPage,
				tagSlug: TEST_TAG_SLUG,
				timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);
	});
}

/**
 * Waits for page readiness and a short settle window for event subscriptions.
 *
 * @param viewerPage Viewer page on the event details route.
 * @return Effect that resolves after the subscription settle delay.
 */
function waitForEventTagRealtimeReady(
	viewerPage: Page,
): Effect.Effect<void, Error> {
	return Effect.gen(function* waitForEventTagRealtimeReadyEffect($) {
		yield* $(
			expectVisibleEffect(viewerPage.getByRole("heading").first(), {
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			}),
		);
		yield* $(fromPromiseVoid(() => viewerPage.waitForTimeout(EVENT_TAG_SUBSCRIBE_SETTLE_MS)));
	});
}


test.describe("Event Tagging: Real-Time Cross-User Visibility", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingEventSlug, "Skipped: set E2E_TEST_EVENT_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

test.beforeEach(async ({ browser }) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* eventBeforeEachEffect($) {
				const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
				const ownerPage = yield* $(acquirePage(ownerCtx));
				const recipientCtx = yield* $(acquireBrowserContext(() => newRecipientContext(browser)));
				const recipientPage = yield* $(acquirePage(recipientCtx));
				yield* $(fromPromise(() => ensureUserNotInEvent(ownerPage)));
				yield* $(fromPromise(() => clearAllPendingPeerShares(recipientPage)));
				yield* $(ensureRecipientCanAccessEvent(ownerPage, recipientPage));
				yield* $(ensureTestTagAbsent(ownerPage));
			}),
		),
	);
});

test("tags appear and disappear on the viewer's open event page without refresh", async ({
	browser,
}) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* eventRealtimeEffect($) {
				const contexts = yield* $(acquireTwoUserContexts(() => createTwoUserContexts(browser)));
				const ownerPage = yield* $(acquirePage(contexts.senderCtx));
				const viewerPage = yield* $(acquirePage(contexts.recipientCtx));
				const errors = setupErrorTracking(viewerPage);

				yield* $(
					openViewerPage({
						page: viewerPage,
						url: `${BASE_URL}/en/event/${testEventSlug}`,
						timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
					}),
				);
				yield* $(waitForEventTagRealtimeReady(viewerPage));

				const eventId = yield* $(navigateToEventEditPage(ownerPage));
				yield* $(
					mutateTagViaApi({
						page: ownerPage,
						itemId: eventId,
						itemType: "event",
						tagSlug: TEST_TAG_SLUG,
						action: "add",
					}),
				);
				yield* $(expectOwnerEditTagState(ownerPage, true));

				yield* $(expectTagBadgeVisible(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

				yield* $(
					mutateTagViaApi({
						page: ownerPage,
						itemId: eventId,
						itemType: "event",
						tagSlug: TEST_TAG_SLUG,
						action: "remove",
					}),
				);
				yield* $(expectOwnerEditTagState(ownerPage, false));

				yield* $(expectTagBadgeHidden(viewerPage, TEST_TAG_SLUG, REALTIME_WAIT_MS));

				const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
				expect(unexpectedErrors).toHaveLength(NO_ERRORS);
			}),
		),
	);
});

test("owner can add and remove a tag in the event edit UI and the change persists", async ({
	browser,
}) => {
	await runEffect(
		Effect.scoped(
			Effect.gen(function* eventUiEffect($) {
				const ownerCtx = yield* $(acquireBrowserContext(() => newSenderContext(browser)));
				const ownerPage = yield* $(acquirePage(ownerCtx));
				yield* $(navigateToEventEditPage(ownerPage));
				yield* $(addTagAndSaveViaUi(ownerPage));

				yield* $(navigateToEventEditPage(ownerPage));
				yield* $(
					expectTagInEditUi({
						page: ownerPage,
						tagSlug: TEST_TAG_SLUG,
						timeoutMs: MANAGE_PAGE_READY_TIMEOUT_MS,
					}),
				);

				yield* $(removeTagAndSaveViaUi(ownerPage));

				yield* $(navigateToEventEditPage(ownerPage));
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
