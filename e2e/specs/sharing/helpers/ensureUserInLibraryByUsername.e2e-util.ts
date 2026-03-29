import { expect, type Page } from "@playwright/test";
import { apiUserLibraryAddPath, apiUserLibraryLookupPath } from "@/shared/paths";

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
}
