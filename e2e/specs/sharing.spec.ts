/**
 * Two-User Sharing and Invitation Tests
 *
 * These tests exercise the full sharing and invitation flows between two real
 * authenticated users connected to the staging (or local) database.
 *
 * --- Prerequisites ---
 *
 * Generate session files once before running (valid 7 days):
 *   npm run e2e:create-session:staging-db          # user 1
 *   npm run e2e:create-session:staging-db:user2    # user 2
 *
 * All tests are automatically skipped when either session file is missing.
 *
 * --- Required test data in the DB ---
 *
 * User 1 (test1@bardoshare.com) must:
 *   - Own at least one song         → set E2E_TEST_SONG_SLUG
 *   - Own at least one playlist     → set E2E_TEST_PLAYLIST_SLUG
 *   - Be admin/owner of a community → set E2E_TEST_COMMUNITY_SLUG
 *   - Be admin of an event          → set E2E_TEST_EVENT_SLUG
 *   - Have user 2 in their user library (follow user 2)
 *
 * User 2 (test2@bardoshare.com) must exist in the DB.
 *   Set E2E_TEST_USER2_USERNAME to user 2's username for the share search.
 *
 * --- Environment variables ---
 *
 *   E2E_TEST_SONG_SLUG        slug of the test song owned by user 1
 *   E2E_TEST_PLAYLIST_SLUG    slug of the test playlist owned by user 1
 *   E2E_TEST_COMMUNITY_SLUG   slug of the test community (user 1 is admin/owner)
 *   E2E_TEST_EVENT_SLUG       slug of the test event (user 1 is admin)
 *   E2E_TEST_USER2_USERNAME   username of user 2 (used for the share/invite search)
 *   PLAYWRIGHT_BASE_URL       base URL under test (default: https://127.0.0.1:5173)
 */
import { existsSync } from "node:fs";

import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { GOOGLE_USER_SESSION_PATH, GOOGLE_USER_SESSION_PATH_2 } from "../utils/auth-helpers";
import { filterExpectedErrors, setupErrorTracking } from "../utils/error-helpers";

// ── constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "https://127.0.0.1:5173";

/** Milliseconds to wait for hydration and Realtime delivery after navigation. */
const HYDRATION_WAIT_MS = 2000;

/**
 * Milliseconds to wait for the user library to be fetched and the manage page
 * access guard to resolve after auth hydration.
 */
const MANAGE_PAGE_READY_TIMEOUT_MS = 20_000;

/** Milliseconds to wait for a Realtime push to land on the recipient dashboard. */
const REALTIME_WAIT_MS = 15_000;

const NO_ERRORS = 0;

/** Milliseconds to wait after a kick/cancel-invite action to let the server process. */
const KICK_SETTLE_MS = 3000;

/** Maximum number of pending shares to decline in cleanup loops. */
const MAX_CLEANUP_ATTEMPTS = 10;

/** Milliseconds to wait for the user suggestion to appear in the search dropdown. */
const USER_SEARCH_SUGGESTION_TIMEOUT_MS = 20_000;

/** Milliseconds to wait for the invite/share success confirmation message to appear. */
const INVITE_SUCCESS_TIMEOUT_MS = 20_000;

// ── test data — resolved once at module load ──────────────────────────────────
// Using String() to avoid conditional operators inside test callbacks.

const testUser2Username = String(process.env["E2E_TEST_USER2_USERNAME"] ?? "");
const testSongSlug = String(process.env["E2E_TEST_SONG_SLUG"] ?? "");
const testPlaylistSlug = String(process.env["E2E_TEST_PLAYLIST_SLUG"] ?? "");
const testCommunitySlug = String(process.env["E2E_TEST_COMMUNITY_SLUG"] ?? "");
const testEventSlug = String(process.env["E2E_TEST_EVENT_SLUG"] ?? "");

// ── skip guards — pre-computed outside describe/test bodies ───────────────────

const bothSessionsExist =
	existsSync(GOOGLE_USER_SESSION_PATH) && existsSync(GOOGLE_USER_SESSION_PATH_2);
const missingBothSessions = !bothSessionsExist;
const missingUser2Username = testUser2Username === "";
const missingSongSlug = testSongSlug === "";
const missingPlaylistSlug = testPlaylistSlug === "";
const missingCommunitySlug = testCommunitySlug === "";
const missingEventSlug = testEventSlug === "";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates two independent browser contexts from the pre-generated session files.
 * Caller is responsible for closing both contexts.
 */
async function createTwoUserContexts(
	browser: Browser,
): Promise<{ senderCtx: BrowserContext; recipientCtx: BrowserContext }> {
	const senderCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH });
	const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
	return { senderCtx, recipientCtx };
}

/**
 * Searches for a user and selects them in a UserSearchInput.
 *
 * The input is located by its associated label text. After typing the
 * username the function waits for the suggestions dropdown to open, then
 * clicks the first matching entry.
 */
async function selectUserInSearch(page: Page, labelText: string, username: string): Promise<void> {
	const input = page.getByLabel(labelText);
	await input.fill(username);
	// Wait for the suggestion dropdown to appear
	const suggestion = page.getByRole("button", { name: username }).first();
	await suggestion.waitFor({ state: "visible", timeout: USER_SEARCH_SUGGESTION_TIMEOUT_MS });
	await suggestion.click();
}

/**
 * Navigates to the recipient's dashboard, switches to the "Received" tab in the
 * Shared Items section, and filters for "Pending" shares only.
 */
async function openReceivedPendingShares(page: Page): Promise<void> {
	await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
	await page.waitForTimeout(HYDRATION_WAIT_MS);
	// Switch to the Received tab (may already be active, but click to be safe)
	await page.getByRole("button", { name: "Received" }).click();
	// Wait briefly for the Received tab to settle before filtering
	await page.waitForTimeout(HYDRATION_WAIT_MS);
	// Filter to Pending so only new shares are visible
	await page.getByRole("button", { name: "Pending" }).click();
}

/**
 * Ensures testUser2Username is not a member or pending invitee of the test
 * community. If a "Cancel Invite" or "Kick" button is visible on the manage
 * page it is clicked, resetting the community state before the next test.
 */
async function ensureUserNotInCommunity(adminPage: Page): Promise<void> {
	await adminPage.goto(`${BASE_URL}/en/community/${testCommunitySlug}/manage`, {
		waitUntil: "load",
	});
	await expect(adminPage.getByLabel("Invite from your library")).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
	const kickBtn = adminPage.getByRole("button", { name: /^(Cancel Invite|Kick)$/ }).first();
	if (await kickBtn.isVisible()) {
		await kickBtn.click();
		await adminPage.waitForTimeout(KICK_SETTLE_MS);
	}
}

/**
 * Ensures testUser2Username is not a participant or pending invitee of the
 * test event. Locates the row for testUser2Username specifically so the
 * admin's own disabled Kick button is not accidentally clicked.
 *
 * ParticipantRow renders:  <p>{username}</p>  <p>role: ... · status: ...</p>
 * Filtering on /role:/ ensures we match only individual participant rows and
 * not a parent container that happens to contain __test2 as a descendant.
 */
async function ensureUserNotInEvent(adminPage: Page): Promise<void> {
	await adminPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
		waitUntil: "load",
	});
	await expect(adminPage.getByLabel("Invite User (username or id)")).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
	// Give the participant list time to render after the invite input appears.
	await adminPage.waitForTimeout(HYDRATION_WAIT_MS);
	// Match the specific ParticipantRow div — it always renders "role: ... ·
	// status: ..." which parent containers do not contain.
	const userRow = adminPage
		.locator("div")
		.filter({ hasText: testUser2Username })
		.filter({ hasText: /role:/ })
		.first();
	const kickBtn = userRow.getByRole("button", { name: "Kick", exact: true });
	const isKickVisible = await kickBtn.isVisible();
	if (isKickVisible && (await kickBtn.isEnabled())) {
		await kickBtn.click();
		await adminPage.waitForTimeout(KICK_SETTLE_MS);
	}
}

/**
 * Declines all pending peer-to-peer shares in the recipient's dashboard.
 * Prevents stale shares from prior test runs from accumulating and
 * interfering with fresh share searches or accept/decline assertions.
 */
async function clearAllPendingPeerShares(recipientPage: Page): Promise<void> {
	await openReceivedPendingShares(recipientPage);
	const declineBtn = recipientPage.getByRole("button", { name: "Decline", exact: true }).first();
	let attempts = 0;
	/* oxlint-disable no-await-in-loop */
	while ((await declineBtn.isVisible()) && attempts < MAX_CLEANUP_ATTEMPTS) {
		await declineBtn.click();
		await recipientPage.waitForTimeout(KICK_SETTLE_MS);
		attempts++;
	}
	/* oxlint-enable no-await-in-loop */
}

// ── P2P Song Share ─────────────────────────────────────────────────────────────

test.describe("P2P Song Share", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingSongSlug, "Skipped: set E2E_TEST_SONG_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const recipientCtx = await browser.newContext({
			storageState: GOOGLE_USER_SESSION_PATH_2,
		});
		const recipientPage = await recipientCtx.newPage();
		try {
			await clearAllPendingPeerShares(recipientPage);
		} finally {
			await recipientCtx.close();
		}
	});

	test("sender shares a song and recipient accepts it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();
			const errors = setupErrorTracking(recipientPage);

			// Sender: open the song page and share it
			await senderPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			await senderPage.waitForTimeout(HYDRATION_WAIT_MS);
			// Intercept the share-creation API call before triggering it so we
			// can confirm the server acknowledged the request.
			const songAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await senderPage.getByRole("button", { name: "Share" }).first().click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			// Confirm the share was persisted before checking the recipient side.
			const songAcceptShareResponse = await songAcceptShareP;
			expect(songAcceptShareResponse.ok()).toBe(true);

			// Recipient: navigate to dashboard and accept the share
			await openReceivedPendingShares(recipientPage);
			await expect(
				recipientPage.getByRole("button", { name: "Accept", exact: true }).first(),
			).toBeVisible({ timeout: REALTIME_WAIT_MS });
			await recipientPage.getByRole("button", { name: "Accept", exact: true }).first().click();

			// Accept button should disappear (share is no longer pending)
			await expect(
				recipientPage.getByRole("button", { name: "Accept", exact: true }).first(),
			).not.toBeVisible({ timeout: REALTIME_WAIT_MS });

			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("sender shares a song and recipient declines it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();

			// Sender: share the song
			await senderPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			await senderPage.waitForTimeout(HYDRATION_WAIT_MS);
			const songDeclineShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await senderPage.getByRole("button", { name: "Share" }).first().click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const songDeclineShareResponse = await songDeclineShareP;
			expect(songDeclineShareResponse.ok()).toBe(true);

			// Recipient: decline the share
			await openReceivedPendingShares(recipientPage);
			await expect(recipientPage.getByRole("button", { name: "Decline" }).first()).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			await recipientPage.getByRole("button", { name: "Decline" }).first().click();

			// Decline button should disappear
			await expect(recipientPage.getByRole("button", { name: "Decline" }).first()).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});

// ── P2P Playlist Share ─────────────────────────────────────────────────────────

test.describe("P2P Playlist Share", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingPlaylistSlug, "Skipped: set E2E_TEST_PLAYLIST_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const recipientCtx = await browser.newContext({
			storageState: GOOGLE_USER_SESSION_PATH_2,
		});
		const recipientPage = await recipientCtx.newPage();
		try {
			await clearAllPendingPeerShares(recipientPage);
		} finally {
			await recipientCtx.close();
		}
	});

	test("sender shares a playlist and recipient accepts it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();

			// Sender: open the playlist page and share it
			await senderPage.goto(`${BASE_URL}/en/playlist/${testPlaylistSlug}`, {
				waitUntil: "load",
			});
			await senderPage.waitForTimeout(HYDRATION_WAIT_MS);
			const playlistAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await senderPage.getByRole("button", { name: "Share" }).first().click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const playlistAcceptShareResponse = await playlistAcceptShareP;
			expect(playlistAcceptShareResponse.ok()).toBe(true);

			// Recipient: accept
			await openReceivedPendingShares(recipientPage);
			await expect(
				recipientPage.getByRole("button", { name: "Accept", exact: true }).first(),
			).toBeVisible({ timeout: REALTIME_WAIT_MS });
			await recipientPage.getByRole("button", { name: "Accept", exact: true }).first().click();
			await expect(
				recipientPage.getByRole("button", { name: "Accept", exact: true }).first(),
			).not.toBeVisible({ timeout: REALTIME_WAIT_MS });
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("sender shares a playlist and recipient declines it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();

			// Sender: share the playlist
			await senderPage.goto(`${BASE_URL}/en/playlist/${testPlaylistSlug}`, {
				waitUntil: "load",
			});
			await senderPage.waitForTimeout(HYDRATION_WAIT_MS);
			const playlistDeclineShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await senderPage.getByRole("button", { name: "Share" }).first().click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const playlistDeclineShareResponse = await playlistDeclineShareP;
			expect(playlistDeclineShareResponse.ok()).toBe(true);

			// Recipient: decline
			await openReceivedPendingShares(recipientPage);
			await expect(recipientPage.getByRole("button", { name: "Decline" }).first()).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			await recipientPage.getByRole("button", { name: "Decline" }).first().click();
			await expect(recipientPage.getByRole("button", { name: "Decline" }).first()).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});

// ── Community Invitation ───────────────────────────────────────────────────────

test.describe("Community Invitation", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingCommunitySlug, "Skipped: set E2E_TEST_COMMUNITY_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const adminCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH });
		const adminPage = await adminCtx.newPage();
		const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
		const recipientPage = await recipientCtx.newPage();
		try {
			await Promise.all([
				ensureUserNotInCommunity(adminPage),
				clearAllPendingPeerShares(recipientPage),
			]);
		} finally {
			await adminCtx.close();
			await recipientCtx.close();
		}
	});

	test("admin invites user and invitee accepts the community invitation", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const adminPage = await senderCtx.newPage();
			const inviteePage = await recipientCtx.newPage();
			const errors = setupErrorTracking(inviteePage);

			// Admin: go to the community manage page and invite user 2
	await adminPage.goto(`${BASE_URL}/en/community/${testCommunitySlug}/manage`, {
				waitUntil: "load",
			});
			// Wait for auth + community fetch to grant manage access
			await expect(adminPage.getByLabel("Invite from your library")).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await selectUserInSearch(adminPage, "Invite from your library", testUser2Username);
			const communityInviteAcceptP = adminPage.waitForResponse(/\/api\/community-user\/add/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const inviteBtn = adminPage.getByRole("button", { name: "Invite Member" });
			await expect(inviteBtn).toBeEnabled();
			await inviteBtn.click();
			const communityInviteAcceptResponse = await communityInviteAcceptP;
			expect(communityInviteAcceptResponse.ok()).toBe(true);
			await expect(adminPage.getByText(/invited successfully/i)).toBeVisible({
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await inviteePage.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
			await inviteePage.waitForTimeout(HYDRATION_WAIT_MS);
			await expect(inviteePage.getByText(/pending invitations/i)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			const communityJoinP = inviteePage.waitForResponse(/\/api\/community-user\/join/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await inviteePage.getByRole("button", { name: "Accept", exact: true }).first().click();
			const communityJoinResponse = await communityJoinP;
			const communityJoinBody = await communityJoinResponse.text().catch(() => "(unreadable)");
			expect(
				communityJoinResponse.ok(),
				`Community join API error — status ${String(communityJoinResponse.status())}: ${communityJoinBody}`,
			).toBe(true);

			// Accept button disappears; "Visit Community →" link appears
			await expect(
				inviteePage.getByRole("button", { name: "Accept", exact: true }).first(),
			).not.toBeVisible({ timeout: REALTIME_WAIT_MS });
			await expect(inviteePage.getByText(/visit community/i)).toBeVisible();

			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("admin invites user and invitee declines the community invitation", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const adminPage = await senderCtx.newPage();
			const inviteePage = await recipientCtx.newPage();

			// Admin: invite user 2
	await adminPage.goto(`${BASE_URL}/en/community/${testCommunitySlug}/manage`, {
				waitUntil: "load",
			});
			// Wait for auth + community fetch to grant manage access
			await expect(adminPage.getByLabel("Invite from your library")).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await selectUserInSearch(adminPage, "Invite from your library", testUser2Username);
			const communityInviteDeclineP = adminPage.waitForResponse(/\/api\/community-user\/add/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const inviteBtn = adminPage.getByRole("button", { name: "Invite Member" });
			await expect(inviteBtn).toBeEnabled();
			await inviteBtn.click();
			const communityInviteDeclineResponse = await communityInviteDeclineP;
			expect(communityInviteDeclineResponse.ok()).toBe(true);
			await expect(adminPage.getByText(/invited successfully/i)).toBeVisible({
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});

			// Invitee: decline
			await inviteePage.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
			await inviteePage.waitForTimeout(HYDRATION_WAIT_MS);
			await expect(inviteePage.getByText(/pending invitations/i)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			await inviteePage.getByRole("button", { name: "Decline" }).first().click();

			// Invitation section clears after decline
			await expect(inviteePage.getByText(/pending invitations/i)).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});

// ── Event Invitation ───────────────────────────────────────────────────────────

test.describe("Event Invitation", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingEventSlug, "Skipped: set E2E_TEST_EVENT_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const adminCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH });
		const adminPage = await adminCtx.newPage();
		const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
		const recipientPage = await recipientCtx.newPage();
		try {
			await Promise.all([
				ensureUserNotInEvent(adminPage),
				clearAllPendingPeerShares(recipientPage),
			]);
		} finally {
			await adminCtx.close();
			await recipientCtx.close();
		}
	});

	test("admin invites user and invitee accepts the event invitation", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const adminPage = await senderCtx.newPage();
			const inviteePage = await recipientCtx.newPage();
			const errors = setupErrorTracking(inviteePage);

			// Admin: go to the event manage page and invite user 2
	await adminPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
				waitUntil: "load",
			});
			// Wait for auth + event fetch to grant manage access
			await expect(adminPage.getByLabel("Invite User (username or id)")).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await selectUserInSearch(adminPage, "Invite User (username or id)", testUser2Username);
			const eventInviteAcceptP = adminPage.waitForResponse(/\/api\/event-user\/add/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const inviteBtn = adminPage.getByRole("button", { name: "Invite Participant" });
			await expect(inviteBtn).toBeEnabled();
			await inviteBtn.click();
			const eventInviteAcceptResponse = await eventInviteAcceptP;
			const eventInviteAcceptBody = await eventInviteAcceptResponse
				.text()
				.catch(() => "(unreadable)");
			expect(
				eventInviteAcceptResponse.ok(),
				`Event invite API error (accept) — status ${String(eventInviteAcceptResponse.status())}: ${eventInviteAcceptBody}`,
			).toBe(true);
			await expect(adminPage.getByText(/participant invited/i)).toBeVisible({
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});

			// Invitee: accept the event invitation on dashboard
			await inviteePage.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
			await inviteePage.waitForTimeout(HYDRATION_WAIT_MS);
			await expect(inviteePage.getByText(/pending invitations/i)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			const eventJoinP = inviteePage.waitForResponse(/\/api\/event-user\/join/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await inviteePage.getByRole("button", { name: "Accept", exact: true }).first().click();
			const eventJoinResponse = await eventJoinP;
			const eventJoinBody = await eventJoinResponse.text().catch(() => "(unreadable)");
			expect(
				eventJoinResponse.ok(),
				`Event join API error — status ${String(eventJoinResponse.status())}: ${eventJoinBody}`,
			).toBe(true);

			// Accept button disappears; "Visit Event →" link appears
			await expect(
				inviteePage.getByRole("button", { name: "Accept", exact: true }).first(),
			).not.toBeVisible({ timeout: REALTIME_WAIT_MS });
			await expect(inviteePage.getByText(/visit event/i)).toBeVisible();

			const unexpectedErrors = filterExpectedErrors(errors.consoleErrors);
			expect(unexpectedErrors).toHaveLength(NO_ERRORS);
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});

	test("admin invites user and invitee declines the event invitation", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const adminPage = await senderCtx.newPage();
			const inviteePage = await recipientCtx.newPage();

			// Admin: invite user 2
	await adminPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
				waitUntil: "load",
			});
			// Wait for auth + event fetch to grant manage access
			await expect(adminPage.getByLabel("Invite User (username or id)")).toBeVisible({
				timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
			});
			await selectUserInSearch(adminPage, "Invite User (username or id)", testUser2Username);
			const eventInviteDeclineP = adminPage.waitForResponse(/\/api\/event-user\/add/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const inviteBtn = adminPage.getByRole("button", { name: "Invite Participant" });
			await expect(inviteBtn).toBeEnabled();
			await inviteBtn.click();
			const eventInviteDeclineResponse = await eventInviteDeclineP;
			const eventInviteDeclineBody = await eventInviteDeclineResponse
				.text()
				.catch(() => "(unreadable)");
			expect(
				eventInviteDeclineResponse.ok(),
				`Event invite API error (decline) — status ${String(eventInviteDeclineResponse.status())}: ${eventInviteDeclineBody}`,
			).toBe(true);
			await expect(adminPage.getByText(/participant invited/i)).toBeVisible({
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});

			// Invitee: decline
			await inviteePage.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
			await inviteePage.waitForTimeout(HYDRATION_WAIT_MS);
			await expect(inviteePage.getByText(/pending invitations/i)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
			await inviteePage.getByRole("button", { name: "Decline" }).first().click();

			// Invitation section clears after decline
			await expect(inviteePage.getByText(/pending invitations/i)).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});
