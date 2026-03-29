import { expect, test } from "@playwright/test";

import filterExpectedErrors from "@/e2e/utils/filterExpectedErrors.e2e-util.ts";
import setupErrorTracking from "@/e2e/utils/setupErrorTracking.e2e-util.ts";

import clearAllPendingPeerShares from "@/e2e/specs/sharing/helpers/clearAllPendingPeerShares.e2e-util.ts";
import createTwoUserContexts from "@/e2e/specs/sharing/helpers/createTwoUserContexts.e2e-util.ts";
import ensureUserNotInEvent from "@/e2e/specs/sharing/helpers/ensureUserNotInEvent.e2e-util.ts";
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
	missingEventSlug,
	missingUser2Username,
	testEventSlug,
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

test.describe("Event Invitation", () => {
	test.skip(missingBothSessions, "Skipped: run npm run e2e:create-session:staging-db[:user2]");
	test.skip(missingEventSlug, "Skipped: set E2E_TEST_EVENT_SLUG");
	test.skip(missingUser2Username, "Skipped: set E2E_TEST_USER2_USERNAME");

	// 200 s covers: cold-start wrangler compile (~65 s) + MANAGE_PAGE_READY_TIMEOUT_MS
	// (75 s) + test body actions, which together can exceed the default 90 s
	// (30 s × test.slow() tripling from --timeout=30000).
	const COLD_START_TEST_TIMEOUT_MS = 200_000;

	test.beforeEach(async ({ browser }, testInfo) => {
		testInfo.setTimeout(COLD_START_TEST_TIMEOUT_MS);
		const adminCtx = await newSenderContext(browser);
		const adminPage = await adminCtx.newPage();
		const recipientCtx = await newRecipientContext(browser);
		const recipientPage = await recipientCtx.newPage();
		try {
			// Sequential: avoid server contention between two contexts hitting the
			// wrangler worker simultaneously, which can push the 75 s timeout on the
			// event manage page past its limit in Firefox / WebKit.
			await ensureUserNotInEvent(adminPage);
			await clearAllPendingPeerShares(recipientPage);
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

			// Reload to ensure the dashboard reflects the accepted invitation.
			await inviteePage.reload({ waitUntil: "load" });

			// Pending invitations section clears; "Visit Event →" link appears
			await expect(inviteePage.getByText(/pending invitations/i)).not.toBeVisible({
				timeout: INVITE_SUCCESS_TIMEOUT_MS,
			});

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
