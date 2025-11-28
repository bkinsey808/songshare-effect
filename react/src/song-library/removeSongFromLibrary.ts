import { type RemoveFromLibraryRequest } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

export async function removeSongFromLibrary(
	request: Readonly<RemoveFromLibraryRequest>,
	get: () => SongLibrarySlice,
): Promise<void> {
	const { setLibraryError, isInLibrary, removeLibraryEntry } = get();

	// Clear any previous errors
	setLibraryError(undefined);

	// Check if song is in library
	if (!isInLibrary(request.song_id)) {
		console.warn("[removeFromLibrary] Song not in library:", request.song_id);
		return;
	}

	// Import here to avoid circular dependencies
	const { getSupabaseAuthToken } =
		await import("@/react/supabase/getSupabaseAuthToken");
	const { getSupabaseClient } = await import("@/react/supabase/supabaseClient");
	const userToken = await getSupabaseAuthToken();
	const client = getSupabaseClient(userToken);

	if (!client) {
		throw new Error("No Supabase client available");
	}

	// Delete the library entry
	// RLS policies ensure the user can only delete their own entries
	const { error } = await client
		.from("song_library")
		.delete()
		.eq("song_id", request.song_id);

	if (error) {
		throw error;
	}

	// Remove from local state immediately (optimistic update)
	removeLibraryEntry(request.song_id);
}
