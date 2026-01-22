import getErrorMessage from "@/shared/utils/getErrorMessage";
import { isRecord, isString } from "@/shared/utils/typeGuards";

import type { SongLibrarySlice } from "./song-library-slice";
import type { RemoveSongFromSongLibraryRequest } from "./song-library-types";

import getSupabaseAuthToken from "../supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "../supabase/client/getSupabaseClient";

function isEqFunction(value: unknown): value is (col: string, val: string) => Promise<unknown> {
	return typeof value === "function";
}

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

	// Validate request shape to avoid passing unsafe `any` into string params
	if (!isRecord(request) || !isString(request.song_id)) {
		throw new Error("Invalid request to removeSongFromSongLibrary: missing song_id");
	}

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

	// Delete the library entry (RLS ensures permission checks)
	const fromObj = client.from("song_library");
	if (typeof fromObj.delete !== "function") {
		throw new TypeError("Supabase client missing delete on from(...)");
	}
	const deleteRes = fromObj.delete?.();
	const maybeEq = isRecord(deleteRes) ? deleteRes["eq"] : undefined;
	if (!isEqFunction(maybeEq)) {
		throw new TypeError("Supabase delete returned unexpected shape");
	}
	const rawDeleteRes = await maybeEq("song_id", request.song_id);
	if (!isRecord(rawDeleteRes)) {
		throw new Error("Invalid response from Supabase deleting song_library entry");
	}
	const deleteError = rawDeleteRes["error"];
	if (deleteError !== undefined && deleteError !== null) {
		throw new Error(getErrorMessage(deleteError, "Error deleting song from library"));
	}
	// Remove from local state immediately (optimistic update)
	removeSongLibraryEntry(request.song_id);
}
