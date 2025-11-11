import type {
	AddToLibraryRequest,
	SongLibraryEntry,
} from "./song-library-schema";
import type { SongLibrarySlice } from "./song-library-slice";

export async function addSongToLibrary(
	request: Readonly<AddToLibraryRequest>,
	get: () => SongLibrarySlice,
): Promise<void> {
	const { setLibraryError, isInLibrary, addLibraryEntry } = get();

	// Clear any previous errors
	setLibraryError(undefined);

	// Check if already in library
	if (isInLibrary(request.song_id)) {
		console.warn("[addToLibrary] Song already in library:", request.song_id);
		return;
	}

	// Import here to avoid circular dependencies
	const { getSupabaseAuthToken } = await import(
		"@/react/supabase/getSupabaseAuthToken"
	);
	const { getSupabaseClient } = await import("@/react/supabase/supabaseClient");
	const userToken = await getSupabaseAuthToken();
	const client = getSupabaseClient(userToken);

	if (!client) {
		throw new Error("No Supabase client available");
	}

	// Extract user_id from the token
	const {
		data: { user },
		error: userError,
	} = await client.auth.getUser();

	if (
		userError !== null ||
		!user?.app_metadata ||
		user.app_metadata["user"] === null ||
		user.app_metadata["user"] === undefined ||
		typeof user.app_metadata["user"] !== "object" ||
		(user.app_metadata["user"] as { user_id?: unknown }).user_id === undefined
	) {
		throw new Error("No authenticated user found");
	}

	const userId = (user.app_metadata["user"] as { user_id: string }).user_id;

	// Insert the new library entry
	const { data, error } = await client
		.from("song_library")
		.insert({
			user_id: userId,
			song_id: request.song_id,
			song_owner_id: request.song_owner_id,
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	// Fetch the owner's username to include in the library entry
	try {
		const { data: ownerData, error: ownerError } = await client
			.from("user_public")
			.select("username")
			.eq("user_id", request.song_owner_id)
			.single();

		// Add to local state immediately (optimistic update) with owner username if available
		if (ownerError || !ownerData?.username) {
			// Add without username
			addLibraryEntry(data as SongLibraryEntry);
		} else {
			// Add with username
			const libraryEntryWithUsername: SongLibraryEntry = {
				...(data as SongLibraryEntry),
				owner_username: ownerData.username,
			};
			addLibraryEntry(libraryEntryWithUsername);
		}
	} catch (userFetchError) {
		console.warn(
			"[addToLibrary] Could not fetch owner username:",
			userFetchError,
		);
		// Still add the entry without username
		addLibraryEntry(data as SongLibraryEntry);
	}
}
