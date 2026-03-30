import { BASE_URL, MANAGE_PAGE_READY_TIMEOUT_MS } from "@/e2e/specs/sharing/helpers/sharing-constants.e2e-util.ts";
import { apiUserLibraryAddPath, apiUserLibraryLookupPath } from "@/shared/paths";
import { expect, type Page } from "@playwright/test";

const LIBRARY_SYNC_ATTEMPTS = 4;

function syncUserLibraryPage(page: Page, username: string): Promise<void> {
	const attempts = LIBRARY_SYNC_ATTEMPTS;
	const FIRST_ATTEMPT = 0;
	const INCREMENT = 1;
	const LAST_ATTEMPT = attempts - INCREMENT;

	async function tryOnce(attempt: number): Promise<void> {
		await page.goto(`${BASE_URL}/en/dashboard/user-library`, { waitUntil: "load" });
		await expect(page.getByRole("heading", { name: /my user library/i })).toBeVisible({
			timeout: MANAGE_PAGE_READY_TIMEOUT_MS,
		});

		const matchingUsername = page
			.getByRole("link", { name: username, exact: true })
			.or(page.getByText(username, { exact: true }))
			.first();
		const usernameVisible = await matchingUsername
			.waitFor({ state: "visible", timeout: 5000 })
			.then(() => true)
			.catch(() => false);

		if (usernameVisible) {
			return;
		}

		if (attempt >= LAST_ATTEMPT) {
			throw new Error(`User library did not surface ${username} after add`);
		}

		return tryOnce(attempt + INCREMENT);
	}

	return tryOnce(FIRST_ATTEMPT);
}

/**
 * Ensures the given username is present in the current user's library.
 *
 * @param page Authenticated page whose session should own the library entry.
 * @param username Username to resolve and add to the current user's library.
 * @return Promise that resolves after lookup and add requests succeed.
 */
export default async function ensureUserInLibraryByUsername(
	page: Page,
	username: string,
): Promise<void> {
	const lookupResponse = await page.request.post(apiUserLibraryLookupPath, {
		data: { username },
	});
	expect(lookupResponse.ok()).toBe(true);
	const lookupBody: unknown = await lookupResponse.json();
	const followedUserId =
		typeof lookupBody === "object" &&
		lookupBody !== null &&
		"data" in lookupBody &&
		typeof lookupBody.data === "object" &&
		lookupBody.data !== null &&
		"user_id" in lookupBody.data &&
		typeof lookupBody.data.user_id === "string"
			? lookupBody.data.user_id
			: undefined;
	expect(followedUserId).toBeTruthy();

	const addResponse = await page.request.post(apiUserLibraryAddPath, {
		data: { followed_user_id: followedUserId },
	});
	expect(addResponse.ok()).toBe(true);

	await syncUserLibraryPage(page, username);
}
