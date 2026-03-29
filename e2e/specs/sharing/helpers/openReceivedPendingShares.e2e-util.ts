import { expect, type Page } from "@playwright/test";
import { BASE_URL, MANAGE_PAGE_READY_TIMEOUT_MS } from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";

/**
 * Navigates to the dashboard and filters the shared items to the pending tab.
 *
 * @param page Authenticated recipient page.
 * @return Promise that resolves once the Pending tab is open.
 */
export default async function openReceivedPendingShares(page: Page): Promise<void> {
	await page.goto(`${BASE_URL}/en/dashboard`, { waitUntil: "load" });
	const receivedBtn = page.getByRole("button", { name: "Received" });
	await expect(receivedBtn).toBeVisible({ timeout: MANAGE_PAGE_READY_TIMEOUT_MS });
	await receivedBtn.click();
	await page.getByRole("button", { name: "Pending" }).click();
}
