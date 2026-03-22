import { Effect } from "effect";

import { clientWarn } from "@/react/lib/utils/clientLogger";
import acceptPendingSharesForItem from "@/react/share/effects/acceptPendingSharesForItem";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { apiPlaylistLibraryAddPath } from "@/shared/paths";

import guardAsAddPlaylistRequest from "../guards/guardAsAddPlaylistRequest";
import guardAsPlaylistLibraryEntry from "../guards/guardAsPlaylistLibraryEntry";
import type { AddPlaylistToLibraryRequest } from "../slice/playlist-library-types";
import type { PlaylistLibrarySlice } from "../slice/PlaylistLibrarySlice.type";

/**
 * Add a playlist to the current user's library (via server endpoint) using Effect.
 * This also adds all songs in the playlist to the user's song library.
 *
 * - Validates the request shape
 * - Skips if the playlist is already in the library
 * - Performs the POST request and validates the server JSON response
 * - Updates local state via `addPlaylistLibraryEntry`
 *
 * @param request - Request containing `playlist_id` and `playlist_owner_id`
 * @param get - Zustand slice getter for accessing state and mutation helpers
 * @returns Effect that completes when the operation succeeds or fails with an Error
 */
export default function addPlaylistToLibrary(
	request: Readonly<AddPlaylistToLibraryRequest>,
	get: () => PlaylistLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* addPlaylistToLibraryGen($) {
		const { setPlaylistLibraryError, isInPlaylistLibrary, addPlaylistLibraryEntry } = get();

		// Clear previous errors
		yield* $(
			Effect.sync(() => {
				setPlaylistLibraryError(undefined);
			}),
		);

		// Validate request shape (client sends playlist_id and playlist_owner_id only)
		const input = yield* $(
			Effect.try({
				try: () => guardAsAddPlaylistRequest(request, "addPlaylistToLibrary"),
				catch: (err) => new Error(extractErrorMessage(err, "Invalid request")),
			}),
		);

		// Early exit if already present
		const alreadyInLibrary = yield* $(Effect.sync(() => isInPlaylistLibrary(input.playlist_id)));
		if (alreadyInLibrary) {
			yield* $(
				Effect.sync(() => {
					clientWarn("[addPlaylistToLibrary] Playlist already in library:", input.playlist_id);
				}),
			);
			return;
		}

		// Perform POST
		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiPlaylistLibraryAddPath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							playlist_id: input.playlist_id,
						}),
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

		// Extract data from { success, data } response shape (handleHttpEndpoint wraps success)
		const responseData =
			typeof responseJson === "object" && responseJson !== null && "data" in responseJson
				? (responseJson as { data: unknown }).data
				: responseJson;

		// Validate server response shape
		const output = yield* $(
			Effect.try({
				try: () => guardAsPlaylistLibraryEntry(responseData, "server response"),
				catch: (err) => new Error(extractErrorMessage(err, "Invalid server response")),
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addPlaylistLibraryEntry(output);
			}),
		);

		// Accept any pending shares for this playlist (non-fatal)
		yield* $(
			acceptPendingSharesForItem("playlist", input.playlist_id, get).pipe(
				Effect.catchAll(() => Effect.succeed(undefined)),
			),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = extractErrorMessage(err, "Unknown error");
				clientWarn("[addPlaylistToLibrary] Failed to add playlist to library:", msg);
				const { setPlaylistLibraryError } = get();
				setPlaylistLibraryError(msg);
			}),
		),
	);
}
