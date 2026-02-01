import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiSongsDeletePath } from "@/shared/paths";

type DeleteSongResult = { success: true } | { success: false; errorMessage: string };

/**
 * Sends a delete request for the given song. Does not throw; returns a result.
 */
export default async function deleteSongRequest(songId: string): Promise<DeleteSongResult> {
	try {
		const response = await fetch(apiSongsDeletePath, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ song_id: songId }),
			credentials: "include",
		});
		if (response.ok) {
			return { success: true };
		}
		const raw: unknown = await response.json();
		const errorMessage = extractErrorMessage(raw, response.statusText);
		return { success: false, errorMessage };
	} catch (error) {
		const message = extractErrorMessage(error, "Failed to delete song");
		return { success: false, errorMessage: message };
	}
}
