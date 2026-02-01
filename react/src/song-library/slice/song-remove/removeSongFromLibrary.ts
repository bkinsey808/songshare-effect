import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { SongLibrarySlice } from "../song-library-slice";
import type { RemoveSongFromSongLibraryRequest } from "../song-library-types";

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
export default function removeSongFromSongLibrary(
	request: Readonly<RemoveSongFromSongLibraryRequest>,
	get: () => SongLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removeSongGen($) {
		const { setSongLibraryError, isInSongLibrary, removeSongLibraryEntry } = get();

		// Clear any previous errors
		yield* $(
			Effect.sync(() => {
				setSongLibraryError(undefined);
			}),
		);

		// Validate request shape and extract songId
		const songId = yield* $(
			Effect.try({
				try: () => {
					if (!isRecord(request) || !isString(request.song_id)) {
						throw new Error("Invalid request to removeSongFromSongLibrary: missing song_id");
					}
					return request.song_id;
				},
				catch: (err) => new Error(extractErrorMessage(err, "Invalid request")),
			}),
		);

		// Check if song is in library
		const inLibrary = yield* $(Effect.sync(() => isInSongLibrary(songId)));
		if (!inLibrary) {
			yield* $(
				Effect.sync(() => {
					console.warn("[removeSongFromSongLibrary] Song not in library:", songId);
				}),
			);
			return;
		}

		// Get auth token
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(extractErrorMessage(err, "Failed to get auth token")),
			}),
		);

		// Get client
		const client = yield* $(
			Effect.try({
				try: () => {
					const clientInstance = getSupabaseClient(userToken);
					if (!clientInstance) {
						throw new Error("No Supabase client available");
					}
					return clientInstance;
				},
				catch: (err) => new Error(extractErrorMessage(err, "Unknown error")),
			}),
		);

		// Delete the library entry (RLS ensures permission checks)
		const fromObj = client.from("song_library");
		if (typeof fromObj.delete !== "function") {
			return yield* $(Effect.fail(new TypeError("Supabase client missing delete on from(...)")));
		}
		const deleteRes = fromObj.delete?.();
		const maybeEq = isRecord(deleteRes) ? deleteRes["eq"] : undefined;
		if (!isEqFunction(maybeEq)) {
			return yield* $(Effect.fail(new TypeError("Supabase delete returned unexpected shape")));
		}
		const rawDeleteRes = yield* $(
			Effect.tryPromise({
				try: () => maybeEq("song_id", songId),
				catch: (err) => new Error(extractErrorMessage(err, "Delete failed")),
			}),
		);
		if (!isRecord(rawDeleteRes)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase deleting song_library entry")),
			);
		}
		const deleteError = rawDeleteRes["error"];
		if (deleteError !== undefined && deleteError !== null) {
			return yield* $(
				Effect.fail(
					new Error(extractErrorMessage(deleteError, "Error deleting song from library")),
				),
			);
		}
		// Remove from local state immediately (optimistic update)
		yield* $(
			Effect.sync(() => {
				removeSongLibraryEntry(songId);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Failed to remove song from library");
				const { setSongLibraryError } = get();
				setSongLibraryError(msg);
			}),
		),
	);
}
