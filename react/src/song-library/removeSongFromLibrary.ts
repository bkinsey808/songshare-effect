import getSupabaseAuthToken from "../supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "../supabase/client/getSupabaseClient";
import { type RemoveSongFromSongLibraryRequest } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

/**
 * Remove a song from the current user's library (optimistic update).
 *
 * Performs a Supabase delete on `song_library` for the provided `song_id`.
 * If the delete succeeds, the local store is updated via
 * `removeSongLibraryEntry`. RLS policies ensure users can only delete their own
 * entries.
 *
 * @param request - Object containing `song_id` to remove
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns void (resolves when the operation completes)
 * @throws Error when no Supabase client is available or the delete fails
 */
export default async function removeSongFromSongLibrary(
	request: Readonly<RemoveSongFromSongLibraryRequest>,
	get: () => SongLibrarySlice,
): Promise<void> {
	const { setSongLibraryError, isInSongLibrary, removeSongLibraryEntry } = get();

	// Clear any previous errors
	setSongLibraryError(undefined);

	// Check if song is in library
	if (!isInSongLibrary(request.song_id)) {
		console.warn("[removeSongFromSongLibrary] Song not in library:", request.song_id);
		return;
	}

	const userToken = await getSupabaseAuthToken();
	const client = getSupabaseClient(userToken);

	if (!client) {
		throw new Error("No Supabase client available");
	}

	// Delete the library entry
	// RLS policies ensure the user can only delete their own entries
	const { error } = await client.from("song_library").delete().eq("song_id", request.song_id);

	if (error) {
		throw error;
	}

	// Remove from local state immediately (optimistic update)
	removeSongLibraryEntry(request.song_id);
}
