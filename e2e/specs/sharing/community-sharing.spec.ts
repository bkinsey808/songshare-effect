import { expect, test } from "@playwright/test";

import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";

import clearAllPendingPeerShares from "@/e2e/specs/sharing/helpers/clearAllPendingPeerShares.e2e-util.ts";
import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import ensureUserNotInCommunity from "@/e2e/specs/sharing/helpers/ensureUserNotInCommunity.e2e-util.ts";
import newRecipientContext from "@/e2e/specs/sharing/helpers/newRecipientContext.e2e-util.ts";
import newSenderContext from "@/e2e/specs/sharing/helpers/newSenderContext.e2e-util.ts";
import selectUserInSearch from "@/e2e/specs/sharing/helpers/selectUserInSearch.e2e-util.ts";
import {
	BASE_URL,
	INVITE_SUCCESS_TIMEOUT_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	NO_ERRORS,
	REALTIME_WAIT_MS,
	missingBothSessions,
	missingCommunitySlug,
	missingUser2Username,
	testCommunitySlug,
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

test.describe("Community Invitation", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingCommunitySlug, "Skipped: set E2E_TEST_COMMUNITY_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	test.beforeEach(async ({ browser }) => {
		const adminCtx = await newSenderContext(browser);
		const adminPage = await adminCtx.newPage();
		const recipientCtx = await newRecipientContext(browser);
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

			// "Visit Community →" link appears (proves acceptance was processed;
			// mutually exclusive with Accept button in the component)
			await expect(inviteePage.getByText(/visit community/i)).toBeVisible({
				timeout: REALTIME_WAIT_MS,
			});

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
