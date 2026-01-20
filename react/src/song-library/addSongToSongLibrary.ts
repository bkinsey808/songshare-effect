import { getSupabaseAuthToken } from "@/react/supabase/getSupabaseAuthToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { clientWarn } from "@/react/utils/clientLogger";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import { type AddSongToSongLibraryRequest, type SongLibraryEntry } from "./song-library-schema";
import { type SongLibrarySlice } from "./song-library-slice";

// Add to local state immediately (optimistic update) with owner username if available
/**
 * Type guard asserting the provided value matches a minimal SongLibraryEntry shape.
 *
 * @param value - Value to check
 * @returns true if value is a SongLibraryEntry-like record (has string `user_id` and `song_id`)
 */
function isSongLibraryEntry(value: unknown): value is SongLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	const { user_id, song_id } = value;
	return isString(user_id) && isString(song_id);
}

/**
 * Type guard for owner data returned by `user_public` queries.
 *
 * @param value - Potential owner data
 * @returns true if `value` is a record with an optional string `username` property
 */
function isOwnerData(value: unknown): value is { username?: string } {
	if (!isRecord(value)) {
		return false;
	}
	const { username } = value;
	return isString(username);
}

/**
 * Add a song to the current user's library (optimistic update).
 *
 * Performs a Supabase insert into `song_library` and attempts to fetch the
 * owner's username to include in the local optimistic entry. On success or
 * failure the local store is updated via `addSongLibraryEntry`.
 *
 * @param request - Request containing `song_id` and `song_owner_id`
 * @param get - Zustand slice getter for accessing state and mutation helpers
 * @returns void (resolves when the operation completes)
 * @throws Error when no Supabase client or authenticated user is available, or when insert fails
 */
export default async function addSongToSongLibrary(
	request: Readonly<AddSongToSongLibraryRequest>,
	get: () => SongLibrarySlice,
): Promise<void> {
	const { setSongLibraryError, isInSongLibrary, addSongLibraryEntry } = get();

	// Clear any previous errors
	setSongLibraryError(undefined);

	// Check if already in library
	if (isInSongLibrary(request.song_id)) {
		clientWarn("[addToSongSongLibrary] Song already in song library:", request.song_id);
		return;
	}

	// Obtain supabase auth token & client
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

	/**
	 * Type guard for Supabase `auth.getUser()` user object that checks for
	 * `app_metadata.user.user_id` presence.
	 *
	 * @param value - The user object to inspect
	 * @returns true if `app_metadata.user.user_id` exists and is a string
	 */
	function isAuthUser(value: unknown): value is { app_metadata: { user?: { user_id?: string } } } {
		if (!isRecord(value)) {
			return false;
		}
		const { app_metadata } = value;
		if (!isRecord(app_metadata)) {
			return false;
		}
		const { user: inner } = app_metadata;
		if (!isRecord(inner)) {
			return false;
		}
		const { user_id } = inner;
		return isString(user_id);
	}

	if (userError !== null || !isAuthUser(user)) {
		throw new Error("No authenticated user found");
	}

	if (!isRecord(user) || !isRecord(user.app_metadata) || !isRecord(user.app_metadata.user)) {
		throw new Error("No authenticated user found");
	}
	const userIdRaw = user.app_metadata.user.user_id;
	if (!isString(userIdRaw)) {
		throw new Error("No authenticated user found");
	}
	const userId = userIdRaw;

	// Insert the new library entry
	const insertResult = await client
		.from("song_library")
		.insert({
			user_id: userId,
			song_id: request.song_id,
			song_owner_id: request.song_owner_id,
		})
		.select()
		.single();

	const { data: rawData, error } = insertResult;
	const data: unknown = rawData as unknown;

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

		if (ownerError || !isOwnerData(ownerData)) {
			if (isSongLibraryEntry(data)) {
				addSongLibraryEntry(data);
			} else {
				// Fallback: attempt to coerce minimal shape
				const fallbackEntry: SongLibraryEntry = {
					user_id: userId,
					song_id: request.song_id,
					song_owner_id: request.song_owner_id,
					// created_at is required by the generated SongLibrary type
					created_at: new Date().toISOString(),
				};
				addSongLibraryEntry(fallbackEntry);
			}
		} else if (isSongLibraryEntry(data)) {
			const libraryEntryWithUsername: SongLibraryEntry = {
				...data,
				owner_username: ownerData.username,
			};
			addSongLibraryEntry(libraryEntryWithUsername);
		} else {
			const fallbackEntryWithUsername: SongLibraryEntry = {
				user_id: userId,
				song_id: request.song_id,
				song_owner_id: request.song_owner_id,
				owner_username: ownerData.username,
				// created_at is required by the generated SongLibrary type
				created_at: new Date().toISOString(),
			};
			addSongLibraryEntry(fallbackEntryWithUsername);
		}
	} catch (error) {
		clientWarn("[addToSongSongLibrary] Could not fetch owner username:", error);
		// Still add the entry without username — use a typed fallback
		const fallbackEntry: SongLibraryEntry = {
			user_id: userId,
			song_id: request.song_id,
			song_owner_id: request.song_owner_id,
			// created_at is required by the generated SongLibrary type
			created_at: new Date().toISOString(),
		};
		addSongLibraryEntry(fallbackEntry);
	}
}
