import { apiUserLibraryAddPath } from "@/shared/paths";

/**
 * addUserToLibraryClient
 *
 * Fire-and-forget request that adds a followed user to the current user's
 * library. Network errors are intentionally swallowed to keep the auto-follow
 * flow unobtrusive and avoid interrupting the user experience.
 *
 * @param followedUserId - The ID of the user to add to the library.
 * @returns - A promise that resolves when the request completes. Errors are
 *   logged and not re-thrown.
 */
export default async function addUserToLibraryClient(followedUserId: string): Promise<void> {
	try {
		await fetch(apiUserLibraryAddPath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ followed_user_id: followedUserId }),
		});
	} catch (error) {
		// Swallow network errors for auto-add behavior — not critical to UX
		console.warn("[addUserToLibraryClient] Failed to add user to library:", error);
	}
}
