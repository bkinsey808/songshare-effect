import { Effect } from "effect";

import type { RemovePlaylistFromLibraryRequest } from "@/react/playlist-library/slice/playlist-library-types";
import type { RemoveSongFromSongLibraryRequest } from "@/react/song-library/slice/song-library-types";

import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import extractErrorStack from "@/shared/error-message/extractErrorStack";

import type { UserLibraryEntry } from "../slice/user-library-types";

import createRemoveUserEffect from "./createRemoveUserEffect";

type Params = Readonly<{
	entry: UserLibraryEntry;
	songsOwnedByUser: readonly string[];
	playlistsOwnedByUser: readonly string[];
	removeFromUserLibrary: (params: {
		readonly followed_user_id: string;
	}) => Effect.Effect<void, Error>;
	removeSongFromSongLibrary: (
		params: RemoveSongFromSongLibraryRequest,
	) => Effect.Effect<void, Error>;
	removePlaylistFromLibrary: (
		params: RemovePlaylistFromLibraryRequest,
	) => Effect.Effect<void, Error>;
}>;

/**
 * Runs the removal Effect and maps/logs errors inside Effect context.
 *
 * This wraps `createRemoveUserEffect` to provide consistent logging and
 * error shaping while keeping the operation fully declarative as an Effect.
 */
export default function runRemoveUserWithContentEffect(params: Params): Effect.Effect<void, Error> {
	return createRemoveUserEffect(params).pipe(
		Effect.mapError((err: unknown) => {
			const msg = extractErrorMessage(err, "Unknown error");
			const stack = extractErrorStack(err);
			console.error("[runRemoveUserWithContentEffect] Error removing user:", msg, stack);
			return err instanceof Error ? err : new Error(msg);
		}),
	);
}
