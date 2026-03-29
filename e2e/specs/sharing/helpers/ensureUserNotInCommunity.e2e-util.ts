import { expect, type Page } from "@playwright/test";
import {
	BASE_URL,
	KICK_SETTLE_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	testCommunitySlug,
} from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";

/**
 * Navigates to the community manage page and removes the existing invite, if any.
 *
 * @param adminPage Authenticated page for the community owner.
 * @return Promise that resolves once the invite is cleared.
 */
export default async function ensureUserNotInCommunity(adminPage: Page): Promise<void> {
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
