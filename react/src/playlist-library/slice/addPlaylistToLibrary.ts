import { Effect } from "effect";

import { clientWarn } from "@/react/utils/clientLogger";
import { apiPlaylistLibraryAddPath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type { PlaylistLibrarySlice } from "./playlist-library-slice";
import type { AddPlaylistToLibraryRequest, PlaylistLibraryEntry } from "./playlist-library-types";

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
 * Validates that a value is a valid PlaylistLibraryEntry.
 * @param value - The value to check.
 * @param context - Context for error messages.
 * @returns The validated entry.
 */
function guardAsPlaylistLibraryEntry(value: unknown, context: string): PlaylistLibraryEntry {
	if (!isRecord(value)) {
		throw new TypeError(`${context}: expected object, got ${typeof value}`);
	}
	if (typeof value["playlist_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid playlist_id`);
	}
	if (typeof value["playlist_owner_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid playlist_owner_id`);
	}
	if (typeof value["user_id"] !== "string") {
		throw new TypeError(`${context}: missing or invalid user_id`);
	}
	if (typeof value["created_at"] !== "string") {
		throw new TypeError(`${context}: missing or invalid created_at`);
	}

	const entry: PlaylistLibraryEntry = {
		playlist_id: value["playlist_id"],
		playlist_owner_id: value["playlist_owner_id"],
		user_id: value["user_id"],
		created_at: value["created_at"],
		...(typeof value["owner_username"] === "string"
			? { owner_username: value["owner_username"] }
			: {}),
		...(isRecord(value["playlist_public"])
			? {
					playlist_public: {
						playlist_name: String(value["playlist_public"]["playlist_name"]),
						playlist_slug: String(value["playlist_public"]["playlist_slug"]),
					},
				}
			: {}),
		...(typeof value["playlist_name"] === "string"
			? { playlist_name: value["playlist_name"] }
			: {}),
		...(typeof value["playlist_slug"] === "string"
			? { playlist_slug: value["playlist_slug"] }
			: {}),
	};

	return entry;
}

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

		// Validate request shape
		const input = yield* $(
			Effect.try({
				try: () => guardAsPlaylistLibraryEntry(request, "addPlaylistToLibrary"),
				catch: (err) => new Error(getErrorMessage(err, "Invalid request")),
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
							playlist_owner_id: input.playlist_owner_id,
						}),
						credentials: "include",
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
				try: () => guardAsPlaylistLibraryEntry(responseJson, "server response"),
				catch: (err) => new Error(getErrorMessage(err, "Invalid server response")),
			}),
		);

		// Update local store
		yield* $(
			Effect.sync(() => {
				addPlaylistLibraryEntry(output);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const msg = getErrorMessage(err);
				clientWarn("[addPlaylistToLibrary] Failed to add playlist to library:", msg);
				const { setPlaylistLibraryError } = get();
				setPlaylistLibraryError(msg);
			}),
		),
	);
}
