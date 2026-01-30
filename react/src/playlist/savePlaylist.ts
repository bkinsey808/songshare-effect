import { Effect } from "effect";

import { apiPlaylistSavePath } from "@/shared/paths";
import isRecord from "@/shared/type-guards/isRecord";
import getErrorMessage from "@/shared/utils/getErrorMessage";

import type { SavePlaylistRequest } from "./playlist-types";
import type { PlaylistSlice } from "./slice/playlist-slice";

/**
 * Save a playlist (create or update) by calling the API endpoint.
 * Returns the playlist_id of the saved playlist.
 *
 * @param request - The playlist data to save
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves with the playlist_id when save completes
 */
export default function savePlaylist(
	request: Readonly<SavePlaylistRequest>,
	get: () => PlaylistSlice,
): Effect.Effect<string, Error> {
	return Effect.gen(function* savePlaylistGen($) {
		const { setPlaylistSaving, setPlaylistError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[savePlaylist] Starting save:", JSON.stringify(request));
				setPlaylistSaving(true);
				setPlaylistError(undefined);
			}),
		);

		const response = yield* $(
			Effect.tryPromise({
				try: () =>
					fetch(apiPlaylistSavePath, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(request),
						credentials: "include",
					}),
				catch: (err) => new Error(`Network error: ${String(err)}`),
			}),
		);

		if (!response.ok) {
			const errorTextOrErr = yield* $(
				Effect.tryPromise({
					try: () => response.text(),
					catch: () => new Error("Unknown error"),
				}),
			);
			const errorText =
				typeof errorTextOrErr === "string"
					? errorTextOrErr
					: getErrorMessage(errorTextOrErr, "Unknown error");
			return yield* $(Effect.fail(new Error(`Failed to save playlist: ${errorText}`)));
		}

		const responseData = yield* $(
			Effect.tryPromise({
				try: async () => {
					const json: unknown = await response.json();
					return json;
				},
				catch: (err) => new Error(`Failed to parse response: ${String(err)}`),
			}),
		);

		if (!isRecord(responseData) || typeof responseData["playlist_id"] !== "string") {
			return yield* $(Effect.fail(new Error("Invalid response from save API")));
		}

		const playlistId = responseData["playlist_id"];

		yield* $(
			Effect.sync(() => {
				console.warn("[savePlaylist] Save complete, playlist_id:", playlistId);
			}),
		);

		return playlistId;
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setPlaylistSaving, setPlaylistError } = get();
				setPlaylistSaving(false);
				const msg = getErrorMessage(err, "Failed to save playlist");
				setPlaylistError(msg);
				console.error("[savePlaylist] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setPlaylistSaving } = get();
				setPlaylistSaving(false);
			}),
		),
		// The pipeline returns an Effect whose inferred error type can include unknown.
		// Use a double-cast to align the type with the declared return type.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	) as unknown as Effect.Effect<string, Error>;
}
