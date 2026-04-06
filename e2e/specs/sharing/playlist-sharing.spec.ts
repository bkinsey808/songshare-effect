import { expect, test, type Locator, type Page } from "@playwright/test";

import clearAllPendingPeerShares from "@/e2e/specs/sharing/helpers/clearAllPendingPeerShares.e2e-util.ts";
import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import newRecipientContext from "@/e2e/specs/sharing/helpers/newRecipientContext.e2e-util.ts";
import openReceivedPendingShares from "@/e2e/specs/sharing/helpers/openReceivedPendingShares.e2e-util.ts";
import selectUserInSearch from "@/e2e/specs/sharing/helpers/selectUserInSearch.e2e-util.ts";

import {
    BASE_URL,
    INVITE_SUCCESS_TIMEOUT_MS,
    MANAGE_PAGE_READY_TIMEOUT_MS,
    REALTIME_WAIT_MS,
    SHARE_CREATE_TIMEOUT_MS,
    missingBothSessions,
    missingPlaylistSlug,
    missingUser2Username,
    testPlaylistSlug,
    testUser2Username,
} from "./helpers/sharing-constants.e2e-util.ts";

// These tests use real shared accounts on staging/local DB and MUST NOT run in parallel
// across multiple workers. Even with 'serial' mode, different browser projects
// will collide. RUN WITH: --workers=1
test.describe.configure({ mode: "serial" });

test.slow();

test.use({
	actionTimeout: 60_000,
	navigationTimeout: 60_000,
});

function waitForRecipientShareAction(
	page: Page,
	actionName: "Accept" | "Decline",
): Promise<Locator> {
	const attempts = 4;
	const FIRST_ATTEMPT = 0;
	const INCREMENT = 1;
	const LAST_ATTEMPT = attempts - INCREMENT;

	async function tryOnce(attempt: number): Promise<Locator> {
		await openReceivedPendingShares(page);
		const actionButton = page.getByRole("button", { name: actionName, exact: true }).first();
		const actionVisible = await actionButton
			.waitFor({ state: "visible", timeout: 5000 })
			.then(() => true)
			.catch(() => false);

		if (actionVisible) {
			return actionButton;
		}

		if (attempt >= LAST_ATTEMPT) {
			await expect(actionButton).toBeVisible({ timeout: REALTIME_WAIT_MS });
			return actionButton;
		}

		await page.reload({ waitUntil: "load" });
		return tryOnce(attempt + INCREMENT);
	}

	return tryOnce(FIRST_ATTEMPT);
}

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
				timeout: SHARE_CREATE_TIMEOUT_MS,
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			await shareBtn.click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const playlistAcceptShareResponse = await playlistAcceptShareP;
			expect(playlistAcceptShareResponse.ok()).toBe(true);

			// Recipient: accept
			const acceptButton = await waitForRecipientShareAction(recipientPage, "Accept");
			const pendingRow = acceptButton.locator(
				"xpath=ancestor::div[.//button[normalize-space()='Accept'] and (.//a or .//span[contains(@class,'font-medium')])][1]",
			);
			const sharedItemNameLocator = pendingRow.locator("a.font-medium, p.font-medium").first();
			await expect(sharedItemNameLocator).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const sharedItemNameRaw = await sharedItemNameLocator.textContent();
			const sharedItemName = sharedItemNameRaw?.trim();
			expect(sharedItemName).not.toBeUndefined();
			expect(sharedItemName).not.toBeNull();
			expect(sharedItemName).not.toBe("");
			const sharedItemNameText = String(sharedItemName);
			const playlistAcceptP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await acceptButton.click();
			const playlistAcceptResponse = await playlistAcceptP;
			expect(playlistAcceptResponse.ok()).toBe(true);
			// Wait for the current view to reflect the accept before reloading,
			// to avoid a race where Firefox reloads before the DB write commits.
			await expect(acceptButton).not.toBeVisible({ timeout: REALTIME_WAIT_MS });
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);
			const pendingAcceptForItem = recipientPage
				.locator("div")
				.filter({ hasText: sharedItemNameText })
				.getByRole("button", { name: "Accept", exact: true })
				.first();
			await expect(pendingAcceptForItem).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
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
				timeout: SHARE_CREATE_TIMEOUT_MS,
			});
			const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
			await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
			await shareBtn.click();
			await selectUserInSearch(senderPage, "Share with user", testUser2Username);
			const playlistDeclineShareResponse = await playlistDeclineShareP;
			expect(playlistDeclineShareResponse.ok()).toBe(true);

			// Recipient: decline
			const declineButton = await waitForRecipientShareAction(recipientPage, "Decline");
			const pendingRow = declineButton.locator(
				"xpath=ancestor::div[.//button[normalize-space()='Decline'] and (.//a or .//span[contains(@class,'font-medium')])][1]",
			);
			const sharedItemNameLocator = pendingRow.locator("a.font-medium, p.font-medium").first();
			await expect(sharedItemNameLocator).toBeVisible({ timeout: REALTIME_WAIT_MS });
			const sharedItemNameRaw = await sharedItemNameLocator.textContent();
			const sharedItemName = sharedItemNameRaw?.trim();
			expect(sharedItemName).not.toBeUndefined();
			expect(sharedItemName).not.toBeNull();
			expect(sharedItemName).not.toBe("");
			const sharedItemNameText = String(sharedItemName);
			const playlistDeclineP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await declineButton.click();
			const playlistDeclineResponse = await playlistDeclineP;
			expect(playlistDeclineResponse.ok()).toBe(true);
			// Wait for the current view to reflect the decline before reloading,
			// to avoid a race where Firefox reloads before the DB write commits.
			await expect(declineButton).not.toBeVisible({ timeout: REALTIME_WAIT_MS });
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);
			const pendingDeclineForItem = recipientPage
				.locator("div")
				.filter({ hasText: sharedItemNameText })
				.getByRole("button", { name: "Decline", exact: true })
				.first();
			await expect(pendingDeclineForItem).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});
		} finally {
			await senderCtx.close();
			await recipientCtx.close();
		}
	});
});
