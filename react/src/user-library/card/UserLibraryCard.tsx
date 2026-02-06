import { Effect } from "effect";
import { useState, type ReactElement } from "react";

import usePlaylistLibrary from "@/react/playlist-library/usePlaylistLibrary";
import useSongLibrary from "@/react/song-library/useSongLibrary";
import useUserLibrary from "@/react/user-library/useUserLibrary";

import type { UserLibraryEntry } from "../slice/user-library-types";

import runRemoveUserFromCardEffect from "../user-remove/runRemoveUserFromCardEffect";
import UserLibraryCardConfirmation from "./UserLibraryCardConfirmation";
import UserLibraryCardDisplay from "./UserLibraryCardDisplay";

type UserLibraryCardProps = {
	entry: UserLibraryEntry;
	currentUserId?: string;
	songsOwnedByUser: string[];
	playlistsOwnedByUser: string[];
};

/**
 * UserLibraryCard
 *
 * Renders a single user library entry card with inline removal confirmation.
 * Shows the user's information and a remove button. When the remove button is
 * clicked, displays an inline confirmation dialog with warnings about what
 * will be removed.
 *
 * @param entry - The user library entry to display
 * @param currentUserId - The ID of the currently authenticated user
 * @param songsOwnedByUser - Array of song IDs owned by this user in the library
 * @param playlistsOwnedByUser - Array of playlist IDs owned by this user in the library
 * @returns - A React element displaying the card or confirmation dialog
 */
export default function UserLibraryCard({
	entry,
	currentUserId,
	songsOwnedByUser,
	playlistsOwnedByUser,
}: UserLibraryCardProps): ReactElement {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	const { removeFromUserLibrary } = useUserLibrary();
	const { removeFromSongLibrary } = useSongLibrary();
	const { removeFromPlaylistLibrary } = usePlaylistLibrary();

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

	if (isConfirming) {
		return (
			<UserLibraryCardConfirmation
				entry={entry}
				isRemoving={isRemoving}
				songsOwnedByUser={songsOwnedByUser}
				playlistsOwnedByUser={playlistsOwnedByUser}
				onConfirm={handleConfirm}
				onCancel={() => {
					setIsConfirming(false);
				}}
			/>
		);
	}

	return (
		<UserLibraryCardDisplay
			entry={entry}
			{...(currentUserId !== undefined && { currentUserId })}
			onRemoveClick={() => {
				setIsConfirming(true);
			}}
		/>
	);
}
