import { type SupabaseClient } from "@supabase/supabase-js";
import { Effect } from "effect";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { type Database } from "@/shared/generated/supabaseTypes";

import { DatabaseError } from "../api-errors";

const ARRAY_EMPTY = 0;

/**
 * Add songs from a playlist to the user's song library.
 * This is called when a user adds another user's playlist to their library.
 *
 * The side‑effect logic is extracted here to keep the top‑level handler
 * focused; other callers (including unit tests) may import and invoke it
 * directly.
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @param playlistId - Playlist ID to get songs from
 */
export default function addPlaylistSongsToUserLibrary(
	client: SupabaseClient<Database>,
	userId: string,
	playlistId: string,
): Effect.Effect<void, DatabaseError> {
	return Effect.gen(function* addSongsGen($) {
		// Get the playlist's song_order
		const playlistResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("playlist_public")
						.select("song_order, user_id")
						.eq("playlist_id", playlistId)
						.single(),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch playlist songs"),
					}),
			}),
		);

		if (playlistResult.error !== null || playlistResult.data === null) {
			console.warn(
				"[addPlaylistSongsToUserLibrary] Could not fetch playlist:",
				playlistResult.error?.message,
			);
			return;
		}

		const songIds = playlistResult.data.song_order ?? [];
		if (songIds.length === ARRAY_EMPTY) {
			return;
		}

		// Get song owner info for each song
		const songsResult = yield* $(
			Effect.tryPromise({
				try: () => client.from("song_public").select("song_id, user_id").in("song_id", songIds),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch song info"),
					}),
			}),
		);

		if (songsResult.error !== null || songsResult.data === null) {
			console.warn(
				"[addPlaylistSongsToUserLibrary] Could not fetch songs:",
				songsResult.error?.message,
			);
			return;
		}

		// Get user's existing song library to avoid duplicates
		const existingLibraryResult = yield* $(
			Effect.tryPromise({
				try: () => client.from("song_library").select("song_id").eq("user_id", userId),
				catch: (error) =>
					new DatabaseError({
						message: extractErrorMessage(error, "Failed to fetch user library"),
					}),
			}),
		);

		const existingSongIds = new Set(
			(existingLibraryResult.data ?? []).map((entry) => entry.song_id),
		);

		// Filter out songs already in library
		const songsToAdd = songsResult.data.filter((song) => !existingSongIds.has(song.song_id));

		if (songsToAdd.length === ARRAY_EMPTY) {
			console.warn("[addPlaylistSongsToUserLibrary] All songs already in library");
			return;
		}

		// Insert songs into user's library
		const libraryEntries = songsToAdd.map((song) => ({
			user_id: userId,
			song_id: song.song_id,
			song_owner_id: song.user_id,
		}));

		yield* $(
			Effect.tryPromise({
				try: () => client.from("song_library").insert(libraryEntries),
				catch: (error) => {
					// Non-fatal: log but don't fail the whole operation
					console.warn(
						`[addPlaylistSongsToUserLibrary] Failed to add songs to library: ${extractErrorMessage(error, "Failed to add songs to library")}`,
					);
					return new DatabaseError({
						message: extractErrorMessage(error, "Failed to add songs to library"),
					});
				},
			}),
		);

		console.warn(
			`[addPlaylistSongsToUserLibrary] Added ${songsToAdd.length} songs to user library`,
		);
	});
}
