import type { Page } from "@playwright/test";
import openReceivedPendingShares from "@/e2e/specs/sharing/helpers/openReceivedPendingShares.e2e-util.ts";
import { KICK_SETTLE_MS, MAX_CLEANUP_ATTEMPTS } from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";

/**
 * Declines on-screen pending shares until the dashboard is empty or the threshold is hit.
 *
 * @param recipientPage Recipient dashboard page that displays pending shares.
 * @return Promise resolving once all visible declines have been attempted.
 */
export default async function clearAllPendingPeerShares(recipientPage: Page): Promise<void> {
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
