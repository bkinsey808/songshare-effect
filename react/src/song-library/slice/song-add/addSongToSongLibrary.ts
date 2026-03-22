import { Effect } from "effect";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import acceptPendingSharesForItem from "@/react/share/effects/acceptPendingSharesForItem";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiSongLibraryAddPath } from "@/shared/paths";

import guardAsSongLibraryEntry from "../guards/guardAsSongLibraryEntry";
import type { SongLibrarySlice } from "../song-library-slice";
import type { AddSongToSongLibraryRequest } from "../song-library-types";

/**
 * Add a song to the current user's library (via server endpoint) using Effect.
 *
 * - Validates the request shape via `guardAsSongLibraryEntry`
 * - Skips inserting if the song is already in the library
 * - Performs the POST request and validates the server JSON response
 * - Updates local state via `addSongLibraryEntry`
 *
 * @param request - Request containing `song_id` and `song_owner_id`
 * @param get - Zustand slice getter for accessing state and mutation helpers
 * @returns Effect that completes when the operation succeeds or fails with an Error
 */
export default function addSongToSongLibrary(
	request: Readonly<AddSongToSongLibraryRequest>,
	get: () => SongLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addSongToSongLibraryGen($) {
		const { setSongLibraryError, isInSongLibrary, addSongLibraryEntry } = get();

		// Clear previous errors
		yield* $(
			Effect.sync(() => {
				setSongLibraryError(undefined);
			}),
		);

		// Validate request shape
		const songId = yield* $(
			Effect.try({
				try: () => {
					if (typeof request.song_id !== "string" || request.song_id === "") {
						throw new Error("addSongToSongLibrary: invalid request");
					}
					return request.song_id;
				},
				catch: (err) => new Error(extractErrorMessage(err, "Invalid request")),
			}),
		);

		// Early exit if already present
		const alreadyInLibrary = yield* $(Effect.sync(() => isInSongLibrary(songId)));
		if (alreadyInLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[addSongToSongLibrary] Song already in song library:", songId);
				}),
			);
			return;
		}

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiSongLibraryAddPath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ song_id: songId }),
						credentials: "include",
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

		// Extract data from { success, data } response shape
		const responseData =
			typeof responseJson === "object" && responseJson !== null && "data" in responseJson
				? (responseJson as { data: unknown }).data
				: responseJson;

		// Validate server response shape
		const output = yield* $(
			Effect.try({
				try: () => guardAsSongLibraryEntry(responseData, "server response"),
				catch: (err) => new Error(extractErrorMessage(err, "Invalid server response")),
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addSongLibraryEntry(output);
			}),
		);

		// Accept any pending shares for this song (non-fatal)
		yield* $(
			acceptPendingSharesForItem("song", songId, get).pipe(
				Effect.catchAll(() => Effect.succeed(undefined)),
			),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Failed to add song to library");
				clientWarn("[addSongToSongLibrary] Failed to add song to library:", msg);
				const { setSongLibraryError } = get();
				setSongLibraryError(msg);
			}),
		),
	);
}
