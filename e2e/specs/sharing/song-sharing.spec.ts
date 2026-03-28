import { expect, test } from "@playwright/test";

import { filterExpectedErrors, setupErrorTracking } from "@/e2e/utils/error-helpers";

import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	clearAllPendingPeerShares,
	createTwoUserContexts,
	missingBothSessions,
	missingSongSlug,
	missingUser2Username,
	newRecipientContext,
	openReceivedPendingShares,
	selectUserInSearch,
	testSongSlug,
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

test.describe("P2P Song Share", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingSongSlug, "Skipped: set E2E_TEST_SONG_SLUG");
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

	test("sender shares a song and recipient accepts it", async ({ browser }) => {
		const { senderCtx, recipientCtx } = await createTwoUserContexts(browser);

		try {
			const senderPage = await senderCtx.newPage();
			const recipientPage = await recipientCtx.newPage();
			const errors = setupErrorTracking(recipientPage);

			// Sender: open the song page and share it
			await senderPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			// Set up the response interceptor only after auth has hydrated and the
			// Share button is ready so the INVITE_SUCCESS_TIMEOUT_MS timer starts
			// just before the click, not during the cold-start auth delay.
			const songAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await shareBtn.click();
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
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			// Set up the response interceptor only after auth has hydrated and the
			// Share button is ready so the INVITE_SUCCESS_TIMEOUT_MS timer starts
			// just before the click, not during the cold-start auth delay.
			const songDeclineShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await shareBtn.click();
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
