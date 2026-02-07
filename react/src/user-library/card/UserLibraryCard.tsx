import { type ReactElement } from "react";

import type { UserLibraryEntry } from "../slice/user-library-types";

import UserLibraryCardConfirmation from "./UserLibraryCardConfirmation";
import UserLibraryCardDisplay from "./UserLibraryCardDisplay";
import useUserLibraryCard from "./useUserLibraryCard";

type UserLibraryCardProps = {
	entry: UserLibraryEntry;
	currentUserId?: string;
	songsOwnedByUser: string[];
	playlistsOwnedByUser: string[];
};

/**
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
	const { isConfirming, isRemoving, startConfirming, cancelConfirming, handleConfirm } =
		useUserLibraryCard({
			entry,
			songsOwnedByUser,
			playlistsOwnedByUser,
		});

	if (isConfirming) {
		return (
			<UserLibraryCardConfirmation
				entry={entry}
				isRemoving={isRemoving}
				songsOwnedByUser={songsOwnedByUser}
				playlistsOwnedByUser={playlistsOwnedByUser}
				onConfirm={handleConfirm}
				onCancel={() => {
					cancelConfirming();
				}}
			/>
		);
	}

	return (
		<UserLibraryCardDisplay
			entry={entry}
			{...(currentUserId !== undefined && { currentUserId })}
			onRemoveClick={() => {
				startConfirming();
			}}
		/>
	);
}
