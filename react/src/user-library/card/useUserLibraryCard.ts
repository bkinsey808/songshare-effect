import { Effect } from "effect";
import { useState } from "react";

import usePlaylistLibrary from "@/react/playlist-library/usePlaylistLibrary";
import useSongLibrary from "@/react/song-library/useSongLibrary";
import useUserLibrary from "@/react/user-library/useUserLibrary";

import type { UserLibraryEntry } from "../slice/user-library-types";

import runRemoveUserFromCardEffect from "../user-remove/runRemoveUserFromCardEffect";

/**
 * Encapsulates the removal confirmation and removal flow for a single user
 * library card.
 *
 * @param entry - The user library entry represented by the card
 * @param songsOwnedByUser - Array of song IDs owned by this user in the library
 * @param playlistsOwnedByUser - Array of playlist IDs owned by this user in the library
 * @returns - State and handlers for the card (confirm/cancel/remove)
 */
export default function useUserLibraryCard({
	entry,
	songsOwnedByUser,
	playlistsOwnedByUser,
}: {
	entry: UserLibraryEntry;
	songsOwnedByUser: string[];
	playlistsOwnedByUser: string[];
}): {
	isConfirming: boolean;
	isRemoving: boolean;
	startConfirming: () => void;
	cancelConfirming: () => void;
	handleConfirm: () => void;
} {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	const { removeFromUserLibrary } = useUserLibrary();
	const { removeFromSongLibrary } = useSongLibrary();
	const { removeFromPlaylistLibrary } = usePlaylistLibrary();

	function startConfirming(): void {
		setIsConfirming(true);
	}

	function cancelConfirming(): void {
		setIsConfirming(false);
	}

	function handleConfirm(): void {
		void Effect.runPromise(
			runRemoveUserFromCardEffect({
				entry,
				songsOwnedByUser,
				playlistsOwnedByUser,
				removeFromUserLibrary,
				removeSongFromSongLibrary: removeFromSongLibrary,
				removePlaylistFromLibrary: removeFromPlaylistLibrary,
				setIsConfirming,
				setIsRemoving,
			}),
		);
	}

	return {
		isConfirming,
		isRemoving,
		startConfirming,
		cancelConfirming,
		handleConfirm,
	} as const;
}
