import { expect, type Page } from "@playwright/test";
import {
	BASE_URL,
	KICK_SETTLE_MS,
	MANAGE_PAGE_READY_TIMEOUT_MS,
	testEventSlug,
	testUser2Username,
} from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";

/**
 * Keeps the event invite state clean by removing or kicking the test user.
 *
 * @param adminPage Event owner page scoped to the manage screen.
 * @return Promise that resolves after the event invite cleanup finishes.
 */
export default async function ensureUserNotInEvent(adminPage: Page): Promise<void> {
	await adminPage.goto(`${BASE_URL}/en/event/${testEventSlug}/manage`, {
		waitUntil: "load",
	});
	await expect(adminPage.getByLabel("Invite User (username or id)")).toBeVisible({
		timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
	});
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
