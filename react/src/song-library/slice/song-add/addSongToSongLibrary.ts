import { Effect } from "effect";

import { clientWarn } from "@/react/utils/clientLogger";
import { apiSongLibraryAddPath } from "@/shared/paths";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type { SongLibrarySlice } from "../song-library-slice";
import type { AddSongToSongLibraryRequest } from "../song-library-types";

import guardAsSongLibraryEntry from "../guards/guardAsSongLibraryEntry";
import extractErrorMessage from "./extractErrorMessage";

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
		const input = yield* $(
			Effect.try({
				try: () => guardAsSongLibraryEntry(request, "addSongToSongLibrary"),
				catch: (err) => new Error(getErrorMessage(err, "Invalid request")),
			}),
		);

		// Early exit if already present
		const alreadyInLibrary = yield* $(Effect.sync(() => isInSongLibrary(input.song_id)));
		if (alreadyInLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[addSongToSongLibrary] Song already in song library:", input.song_id);
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
						body: JSON.stringify({ song_id: input.song_id, song_owner_id: input.song_owner_id }),
					}),
				catch: (err) => new Error(getErrorMessage(err, "Network error")),
			}),
		);

		const responseJson: unknown = yield* $(
			Effect.tryPromise({
				try: () => response.json(),
				catch: () => new Error("Invalid JSON body"),
			}),
		);

		if (!response.ok) {
			const errorData = extractErrorMessage(responseJson);
			return yield* $(
				Effect.fail(
					new Error(errorData ?? `Server returned ${response.status}: ${response.statusText}`),
				),
			);
		}

		// Validate server response shape
		const output = yield* $(
			Effect.try({
				try: () => guardAsSongLibraryEntry(responseJson, "server response"),
				catch: (err) => new Error(getErrorMessage(err, "Invalid server response")),
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addSongLibraryEntry(output);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = getErrorMessage(err);
				clientWarn("[addSongToSongLibrary] Failed to add song to library:", msg);
				const { setSongLibraryError } = get();
				setSongLibraryError(msg);
			}),
		),
	);
}
