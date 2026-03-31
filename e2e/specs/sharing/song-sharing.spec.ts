import { expect, test, type Locator, type Page } from "@playwright/test";

import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";

import clearAllPendingPeerShares from "@/e2e/specs/sharing/helpers/clearAllPendingPeerShares.e2e-util.ts";
import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import ensureUserInLibraryByUsername from "@/e2e/specs/sharing/helpers/ensureUserInLibraryByUsername.e2e-util.ts";
import newRecipientContext from "@/e2e/specs/sharing/helpers/newRecipientContext.e2e-util.ts";
import openReceivedPendingShares from "@/e2e/specs/sharing/helpers/openReceivedPendingShares.e2e-util.ts";
import selectUserInSearch from "@/e2e/specs/sharing/helpers/selectUserInSearch.e2e-util.ts";
import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	SHARE_CREATE_TIMEOUT_MS,
	missingBothSessions,
	missingSongSlug,
	missingUser2Username,
	testSongSlug,
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

async function hasPendingSongShareForUser(senderPage: Page): Promise<boolean> {
	// Wait for async share data to load before checking — the "Shared with" section
	// is populated by a fetch that completes after page navigation. Using isVisible()
	// immediately would return false before the data arrives, causing a race condition
	// where the share check passes (no pending found) but the Share search then excludes
	// the recipient because the data loaded just before the dropdown opened.
	const sharedWithHeadingVisible = await senderPage
		.getByRole("heading", { name: /shared with \([1-9]/i })
		.waitFor({ state: "visible", timeout: MANAGE_PAGE_READY_TIMEOUT_MS })
		.then(() => true)
		.catch(() => false);
	if (!sharedWithHeadingVisible) {
		return false;
	}

	const recipientVisible = await senderPage
		.getByText(testUser2Username, { exact: true })
		.isVisible()
		.catch(() => false);
	if (!recipientVisible) {
		return false;
	}

	return senderPage.getByText(/pending/i).first().isVisible().catch(() => false);
}

function waitForRecipientShareAction(page: Page, actionName: "Accept" | "Decline"): Promise<Locator> {
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

async function ensurePendingShareForUser(senderPage: Page): Promise<void> {
	const existingPendingShare = await hasPendingSongShareForUser(senderPage);
	if (!existingPendingShare) {
		const songAcceptShareP = senderPage.waitForResponse(/\/api\/shares\/create/, {
			timeout: SHARE_CREATE_TIMEOUT_MS,
		});
		const shareBtn = senderPage.getByRole("button", { name: "Share" }).first();
		await expect(shareBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
		await shareBtn.click();
		await selectUserInSearch(senderPage, "Share with user", testUser2Username);
		const songAcceptShareResponse = await songAcceptShareP;
		expect(songAcceptShareResponse.ok()).toBe(true);
	}
}

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
			await ensureUserInLibraryByUsername(senderPage, testUser2Username);
			await senderPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			await ensurePendingShareForUser(senderPage);

			// Recipient: navigate to dashboard and accept the share
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
			const songAcceptP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await acceptButton.click();
			const songAcceptResponse = await songAcceptP;
			expect(songAcceptResponse.ok()).toBe(true);
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);

			// Accepted item should no longer present an Accept action in pending view.
			const pendingAcceptForItem = recipientPage
				.locator("div")
				.filter({ hasText: sharedItemNameText })
				.getByRole("button", { name: "Accept", exact: true })
				.first();
			await expect(pendingAcceptForItem).not.toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

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
			await ensureUserInLibraryByUsername(senderPage, testUser2Username);
			await senderPage.goto(`${BASE_URL}/en/song/${testSongSlug}`, { waitUntil: "load" });
			await ensurePendingShareForUser(senderPage);

			// Recipient: decline the share
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
			const songDeclineP = recipientPage.waitForResponse(/\/api\/shares\/update-status/, {
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});
			await declineButton.click();
			const songDeclineResponse = await songDeclineP;
			expect(songDeclineResponse.ok()).toBe(true);
			await recipientPage.reload({ waitUntil: "load" });
			await openReceivedPendingShares(recipientPage);

			// Declined item should no longer present a Decline action in pending view.
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
