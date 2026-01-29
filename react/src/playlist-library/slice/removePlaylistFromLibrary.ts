import { Effect } from "effect";

import { clientWarn } from "@/react/utils/clientLogger";
import { apiPlaylistLibraryRemovePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type { PlaylistLibrarySlice } from "./playlist-library-slice";
import type { RemovePlaylistFromLibraryRequest } from "./playlist-library-types";

/**
 * Extracts error message from API response.
 * @param responseJson - The parsed JSON response.
 * @returns The error message or undefined.
 */
function extractErrorMessage(responseJson: unknown): string | undefined {
	if (isRecord(responseJson)) {
		if (typeof responseJson["error"] === "string") {
			return responseJson["error"];
		}
		if (typeof responseJson["message"] === "string") {
			return responseJson["message"];
		}
	}
	return undefined;
}

/**
 * Remove a playlist from the current user's library (via server endpoint).
 *
 * - Validates the request shape
 * - Skips if the playlist is not in the library
 * - Performs the DELETE request
 * - Updates local state via `removePlaylistLibraryEntry`
 *
 * @param request - Request containing `playlist_id` to remove
 * @param get - Zustand slice getter for accessing state and mutation helpers
 * @returns Effect that completes when the operation succeeds or fails with an Error
 */
export default function removePlaylistFromLibrary(
	request: Readonly<RemovePlaylistFromLibraryRequest>,
	get: () => PlaylistLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* removePlaylistFromLibraryGen($) {
		const { setPlaylistLibraryError, isInPlaylistLibrary, removePlaylistLibraryEntry } = get();

		// Clear previous errors
		yield* $(
			Effect.sync(() => {
				setPlaylistLibraryError(undefined);
			}),
		);

		// Validate request shape
		const playlistId = yield* $(
			Effect.try({
				try: () => {
					if (!isRecord(request) || !isString(request.playlist_id)) {
						throw new Error("Invalid request to removePlaylistFromLibrary: missing playlist_id");
					}
					return request.playlist_id;
				},
				catch: (err) => new Error(getErrorMessage(err, "Invalid request")),
			}),
		);

		// Early exit if not in library
		const inLibrary = yield* $(Effect.sync(() => isInPlaylistLibrary(playlistId)));
		if (!inLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[removePlaylistFromLibrary] Playlist not in library:", playlistId);
				}),
			);
			return;
		}

		// Optimistic update - remove from local state immediately
		yield* $(
			Effect.sync(() => {
				removePlaylistLibraryEntry(playlistId);
			}),
		);

		// Perform DELETE request
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiPlaylistLibraryRemovePath, {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ playlist_id: playlistId }),
						credentials: "include",
					}),
				catch: (err) => new Error(getErrorMessage(err, "Network error")),
			}),
		);

		if (!response.ok) {
			const responseJson: unknown = yield* $(
				Effect.tryPromise({
					try: () => response.json(),
					catch: () => ({}),
				}),
			);
			const errorData = extractErrorMessage(responseJson);
			// Note: We already removed from local state, but the API failed
			// The realtime subscription will re-add it if still present
			return yield* $(
				Effect.fail(
					new Error(errorData ?? `Server returned ${response.status}: ${response.statusText}`),
				),
			);
		}

		yield* $(
			Effect.sync(() => {
				clientWarn("[removePlaylistFromLibrary] Successfully removed playlist:", playlistId);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = getErrorMessage(err);
				clientWarn("[removePlaylistFromLibrary] Failed to remove playlist:", msg);
				const { setPlaylistLibraryError } = get();
				setPlaylistLibraryError(msg);
			}),
		),
		// The pipeline can include unknown error values; normalize to Error via a double-cast.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<void, Error>;
}
