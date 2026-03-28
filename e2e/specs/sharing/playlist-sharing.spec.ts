import { expect, test } from "@playwright/test";

import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	REALTIME_WAIT_MS,
	clearAllPendingPeerShares,
	createTwoUserContexts,
	missingBothSessions,
	missingPlaylistSlug,
	missingUser2Username,
	newRecipientContext,
	openReceivedPendingShares,
	selectUserInSearch,
	testPlaylistSlug,
	testUser2Username,
} from "./helpers/sharing.e2e-utils.ts";

// These tests use real shared accounts on staging/local DB and MUST NOT run in parallel
// across multiple workers. Even with 'serial' mode, different browser projects
// will collide. RUN WITH: --workers=1
test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

test.describe("P2P Playlist Share", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingPlaylistSlug, "Skipped: set E2E_TEST_PLAYLIST_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const recipientCtx = await newRecipientContext(browser);
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
			const playlistAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			await shareBtn.click();
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
			const playlistDeclineShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			await shareBtn.click();
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
