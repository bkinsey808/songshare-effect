import { apiUserLibraryAddPath } from "@/shared/paths";

/**
 * Fire-and-forget add followed user request used by view-side auto-follow.
 * Keeps the client-side integration minimal for now — store-based user library
 * slice will be implemented later.
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
