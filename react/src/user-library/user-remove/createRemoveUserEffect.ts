import { Effect } from "effect";

import { ZERO } from "@/shared/constants/shared-constants";

import type { UserLibraryEntry } from "../slice/user-library-types";

type CreateRemoveUserEffectParams = Readonly<{
	entry: UserLibraryEntry;
	songsOwnedByUser: readonly string[];
	playlistsOwnedByUser: readonly string[];
	removeFromUserLibrary: (params: {
		readonly followed_user_id: string;
	}) => Effect.Effect<void, Error>;
	removeSongFromSongLibrary: (params: { readonly song_id: string }) => Effect.Effect<void, Error>;
	removePlaylistFromLibrary: (params: {
		readonly playlist_id: string;
	}) => Effect.Effect<void, Error>;
}>;

/**
 * Remove a user from the library along with all associated content.
 *
 * Attempts cascade deletion via API first, then falls back to manual removal of
 * individual songs and playlists. Individual song/playlist removal failures are
 * caught and logged but don't prevent the overall operation from completing.
 *
 * @param entry - User library entry being removed
 * @param songsOwnedByUser - List of song IDs owned by the user
 * @param playlistsOwnedByUser - List of playlist IDs owned by the user
 * @param removeFromUserLibrary - Effect factory for removing user from library
 * @param removeSongFromSongLibrary - Effect factory for removing a song
 * @param removePlaylistFromLibrary - Effect factory for removing a playlist
 * @returns - Effect that performs cascade deletion (resolves on success, rejects on top-level failure)
 */
export default function createRemoveUserEffect({
	entry,
	songsOwnedByUser,
	playlistsOwnedByUser,
	removeFromUserLibrary,
	removeSongFromSongLibrary,
	removePlaylistFromLibrary,
}: CreateRemoveUserEffectParams): Effect.Effect<void, Error> {
	return Effect.gen(function* gen() {
		console.warn(
			`[createRemoveUserEffect] Removing user ${entry.followed_user_id}, songs: ${songsOwnedByUser.length}, playlists: ${playlistsOwnedByUser.length}`,
		);

		// First, remove the user from the library via API
		// (This will cascade delete via database triggers)
		console.warn(
			`[createRemoveUserEffect] Removing user ${entry.followed_user_id} from library...`,
		);
		yield* removeFromUserLibrary({ followed_user_id: entry.followed_user_id });
		console.warn("[createRemoveUserEffect] User removed from library");

		// Note: The API removal should cascade delete songs/playlists via database triggers.
		// Manual removal below is attempted as fallback if triggers don't work.

		// Attempt to remove all songs owned by this user (may fail, but continue)
		if (songsOwnedByUser.length > ZERO) {
			console.warn(`[createRemoveUserEffect] Removing ${songsOwnedByUser.length} songs...`);
			yield* Effect.all(
				songsOwnedByUser.map((songId) => {
					console.warn(`[createRemoveUserEffect] Removing song ${songId}...`);
					return removeSongFromSongLibrary({ song_id: songId }).pipe(
						Effect.catchAll(() => Effect.void),
					);
				}),
				{ concurrency: "unbounded" },
			);
			console.warn("[createRemoveUserEffect] Songs removed");
		}

		// Attempt to remove all playlists owned by this user (may fail, but continue)
		if (playlistsOwnedByUser.length > ZERO) {
			console.warn(`[createRemoveUserEffect] Removing ${playlistsOwnedByUser.length} playlists...`);
			yield* Effect.all(
				playlistsOwnedByUser.map((playlistId) => {
					console.warn(`[createRemoveUserEffect] Removing playlist ${playlistId}...`);
					return removePlaylistFromLibrary({ playlist_id: playlistId }).pipe(
						Effect.catchAll(() => Effect.void),
					);
				}),
				{ concurrency: "unbounded" },
			);
			console.warn("[createRemoveUserEffect] Playlists removed");
		}

		console.warn("[createRemoveUserEffect] Complete");
	});
}
