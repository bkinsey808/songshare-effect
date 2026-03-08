import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiSongLibraryRemovePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { SongLibrarySlice } from "../song-library-slice";
import type { RemoveSongFromSongLibraryRequest } from "../song-library-types";

/**
 * Remove a song from the current user's library (optimistic update).
 *
 * Performs a POST to the server API, which deletes the entry from `song_library`.
 * If the request succeeds, the local store is updated via
 * `removeSongLibraryEntry`. Uses the same API pattern as add and event library remove.
 *
 * @param request - Object containing `song_id` to remove
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns void (resolves when the operation completes)
 * @throws Error when the request is invalid or the API fails
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

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiSongLibraryRemovePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ song_id: songId }),
					}),
				catch: (err) => new Error(extractErrorMessage(err, "Network error")),
			}),
		);

		const responseJson: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json(),
				catch: () => new Error("Invalid JSON body"),
			}),
		);

		if (!response.ok) {
			const errorMsg = extractErrorMessage(
				responseJson,
				`Server returned ${response.status}: ${response.statusText}`,
			);
			return yield* $(Effect.fail(new Error(errorMsg)));
		}

		// Check for success flag in response
		if (!isRecord(responseJson) || !("success" in responseJson)) {
			return yield* $(Effect.fail(new Error("Invalid server response: missing success flag")));
		}

		if (typeof responseJson["success"] !== "boolean") {
			return yield* $(Effect.fail(new Error("Invalid server response: success must be boolean")));
		}

		// Remove from local state (optimistic update)
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
