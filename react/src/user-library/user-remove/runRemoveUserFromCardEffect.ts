import { Effect } from "effect";

import type { RemovePlaylistFromLibraryRequest } from "@/react/playlist-library/slice/playlist-library-types";
import type { RemoveSongFromSongLibraryRequest } from "@/react/song-library/slice/song-library-types";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import extractErrorStack from "@/shared/error-message/extractErrorStack";

import type { UserLibraryEntry } from "../slice/user-library-types";
import runRemoveUserWithContentEffect from "./runRemoveUserWithContentEffect";

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
	setIsConfirming: (value: boolean) => void;
	setIsRemoving: (value: boolean) => void;
}>;

/**
 * Runs the removal flow for a user library entry as an Effect.
 *
 * Updates confirmation and removing UI flags, delegates the actual
 * deletion to `runRemoveUserWithContentEffect`, and maps/logs errors
 * inside Effect context so the UI component can stay declarative.
 *
 * @param params - Configuration options including entry, content IDs, and UI setters.
 * @returns Effect that performs the removal and updates UI state.
 */
export default function runRemoveUserFromCardEffect(params: Params): Effect.Effect<void, Error> {
	const { setIsConfirming, setIsRemoving } = params;

	return Effect.gen(function* runRemovalGen($) {
		yield* $(
			Effect.sync(() => {
				setIsRemoving(true);
			}),
		);

		// Run the existing removal Effect and attach UI updates and error handling
		yield* $(
			runRemoveUserWithContentEffect(params).pipe(
				Effect.tap(() =>
					Effect.sync(() => {
						setIsConfirming(false);
						setIsRemoving(false);
					}),
				),
				Effect.catchAll((err: unknown) => {
					const msg = extractErrorMessage(err, "Unknown error");
					const stack = extractErrorStack(err);
					console.error("[runRemoveUserFromCardEffect] Error removing user:", msg, stack);
					// Ensure UI reflects failure
					return Effect.sync(() => {
						setIsRemoving(false);
					}).pipe(Effect.flatMap(() => Effect.fail(err instanceof Error ? err : new Error(msg))));
				}),
			),
		);
	});
}
