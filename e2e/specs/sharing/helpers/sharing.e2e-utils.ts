import { existsSync } from "node:fs";

import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { GOOGLE_USER_SESSION_PATH, GOOGLE_USER_SESSION_PATH_2 } from "@/e2e/utils/auth-helpers";

// ── constants ────────────────────────────────────────────────────────────────

export const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "https://127.0.0.1:5173";

/** Milliseconds to wait for hydration and Realtime delivery after navigation. */

/**
 * Milliseconds to wait for the user library to be fetched and the manage page
 * access guard to resolve after auth hydration.
 *
 * 75 s accounts for wrangler-dev cold-start: on the first request the worker
 * TypeScript must be compiled (up to ~60 s on WSL2). The Supabase user-token
 * fetch has a 10 s hard abort, so it times out and falls back to the visitor
 * token. Auth re-hydrates once wrangler responds to /api/me (no timeout), then
 * the event/community is re-fetched with the correct token. Total latency can
 * reach ~65 s on a cold run; 75 s gives comfortable headroom while staying
 * within the 90 s test timeout (30 s × 3 from test.slow()) so the test timeout
 * does not fire before this assertion can complete.
 *
 * Tests that have a large beforeEach cost (e.g. event-invitation) should call
 * `testInfo.setTimeout(200_000)` to extend their individual timeout.
 */
export const MANAGE_PAGE_READY_TIMEOUT_MS = 75_000;

/** Milliseconds to wait for a Realtime push to land on the recipient dashboard. */
export const REALTIME_WAIT_MS = 20_000;

export const NO_ERRORS = 0;

/** Milliseconds to wait after a kick/cancel-invite action to let the server process. */
export const KICK_SETTLE_MS = 4000;

/** Maximum number of pending shares to decline in cleanup loops. */
export const MAX_CLEANUP_ATTEMPTS = 10;

/** Milliseconds to wait for the user suggestion to appear in the search dropdown. */
export const USER_SEARCH_SUGGESTION_TIMEOUT_MS = 60_000;

/** Milliseconds to wait for the invite/share success confirmation message to appear. */
export const INVITE_SUCCESS_TIMEOUT_MS = 60_000;

// ── test data ─────────────────────────────────────────────────────────────────
// Using String() to avoid conditional operators inside test callbacks.

export const testUser2Username = String(process.env["E2E_TEST_USER2_USERNAME"] ?? "");
export const testSongSlug = String(process.env["E2E_TEST_SONG_SLUG"] ?? "");
export const testPlaylistSlug = String(process.env["E2E_TEST_PLAYLIST_SLUG"] ?? "");
export const testCommunitySlug = String(process.env["E2E_TEST_COMMUNITY_SLUG"] ?? "");
export const testEventSlug = String(process.env["E2E_TEST_EVENT_SLUG"] ?? "");

// ── skip guards ───────────────────────────────────────────────────────────────

export const missingBothSessions = !(
	existsSync(GOOGLE_USER_SESSION_PATH) && existsSync(GOOGLE_USER_SESSION_PATH_2)
);
export const missingUser2Username = testUser2Username === "";
export const missingSongSlug = testSongSlug === "";
export const missingPlaylistSlug = testPlaylistSlug === "";
export const missingCommunitySlug = testCommunitySlug === "";
export const missingEventSlug = testEventSlug === "";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a browser context with the app version pinned to prevent cache clearing.
 */
export async function newContextWithVersion(
	browser: Browser,
	storageState: string,
): Promise<BrowserContext> {
	const context = await browser.newContext({ storageState });
	await context.addInitScript(() => {
		try {
			localStorage.setItem("app_version", "1.0.0");
		} catch {
			// ignore
		}
	});
	return context;
}

/** Creates a browser context for user 1 (the sender / admin). */
export function newSenderContext(browser: Browser): Promise<BrowserContext> {
	return newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);
}

/** Creates a browser context for user 2 (the recipient / invitee). */
export function newRecipientContext(browser: Browser): Promise<BrowserContext> {
	return newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH_2);
}

/**
 * Creates two independent browser contexts from the pre-generated session files.
 * Caller is responsible for closing both contexts.
 */
export async function createTwoUserContexts(
	browser: Browser,
): Promise<{ senderCtx: BrowserContext; recipientCtx: BrowserContext }> {
	const senderCtx = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH);
	const recipientCtx = await newContextWithVersion(browser, GOOGLE_USER_SESSION_PATH_2);
	return { senderCtx, recipientCtx };
}

/**
 * Searches for a user and selects them in a UserSearchInput.
 *
 * The input is located by its associated label text. After typing the
 * username the function waits for the suggestions dropdown to open, then
 * clicks the first matching entry.
 */
export async function selectUserInSearch(
	page: Page,
	labelText: string,
	username: string,
): Promise<void> {
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
 *
 * The "Received" button lives inside SharedItemsSection, which only renders
 * after auth hydration completes (including wrangler cold-start on the first
 * request, which can take up to ~65 s on WSL2). Use MANAGE_PAGE_READY_TIMEOUT_MS
 * (75 s) as the explicit visibility timeout so WebKit — which is slower than
 * Chromium/Firefox — doesn't time out on the default 60 s actionTimeout.
 */
export async function openReceivedPendingShares(page: Page): Promise<void> {
	await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
	const receivedBtn = page.getByRole("button", { name: "Received" });
	await expect(receivedBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
	await receivedBtn.click();
	await page.getByRole("button", { name: "Pending" }).click();
}

/**
 * Ensures testUser2Username is not a member or pending invitee of the test
 * community. If a "Cancel Invite" or "Kick" button is visible on the manage
 * page it is clicked, resetting the community state before the next test.
 */
export async function ensureUserNotInCommunity(adminPage: Page): Promise<void> {
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
export async function ensureUserNotInEvent(adminPage: Page): Promise<void> {
	await adminPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
		waitUntil: "load",
	});
	await expect(adminPage.getByLabel("Invite User (username or id)")).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
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
export async function clearAllPendingPeerShares(recipientPage: Page): Promise<void> {
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
