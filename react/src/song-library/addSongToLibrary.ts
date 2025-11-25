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
	const { getSupabaseAuthToken } =
		await import("@/react/supabase/getSupabaseAuthToken");
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

	function isAuthUser(
		x: unknown,
	): x is { app_metadata: { user?: { user_id?: string } } } {
		if (typeof x !== "object" || x === null) return false;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const obj = x as Record<string, unknown>;
		if (!Object.prototype.hasOwnProperty.call(obj, "app_metadata"))
			return false;
		const meta = obj["app_metadata"];
		if (typeof meta !== "object" || meta === null) return false;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const metaObj = meta as Record<string, unknown>;
		if (!Object.prototype.hasOwnProperty.call(metaObj, "user")) return false;
		const inner = metaObj["user"];
		if (typeof inner !== "object" || inner === null) return false;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
		const innerObj = inner as Record<string, unknown>;
		return (
			Object.prototype.hasOwnProperty.call(innerObj, "user_id") &&
			typeof innerObj["user_id"] === "string"
		);
	}

	if (userError !== null || !isAuthUser(user)) {
		throw new Error("No authenticated user found");
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	const userId = (user.app_metadata.user as { user_id: string }).user_id;

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
		function isSongLibraryEntry(x: unknown): x is SongLibraryEntry {
			if (typeof x !== "object" || x === null) return false;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
			const obj = x as Record<string, unknown>;
			return (
				Object.prototype.hasOwnProperty.call(obj, "user_id") &&
				typeof obj["user_id"] === "string" &&
				Object.prototype.hasOwnProperty.call(obj, "song_id") &&
				typeof obj["song_id"] === "string"
			);
		}

		function isOwnerData(x: unknown): x is { username?: string } {
			if (typeof x !== "object" || x === null) return false;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
			const obj = x as Record<string, unknown>;
			return (
				Object.prototype.hasOwnProperty.call(obj, "username") &&
				typeof obj["username"] === "string"
			);
		}

		if (ownerError || !isOwnerData(ownerData)) {
			if (isSongLibraryEntry(data)) {
				addLibraryEntry(data);
			} else {
				// Fallback: attempt to coerce minimal shape
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
				addLibraryEntry({
					user_id: userId,
					song_id: request.song_id,
					song_owner_id: request.song_owner_id,
				} as SongLibraryEntry);
			}
		} else {
			if (isSongLibraryEntry(data)) {
				const libraryEntryWithUsername: SongLibraryEntry = {
					...data,
					owner_username: ownerData.username,
				};
				addLibraryEntry(libraryEntryWithUsername);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
				addLibraryEntry({
					user_id: userId,
					song_id: request.song_id,
					song_owner_id: request.song_owner_id,
					owner_username: ownerData.username,
				} as SongLibraryEntry);
			}
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
