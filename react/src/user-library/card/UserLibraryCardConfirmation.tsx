import { useTranslation } from "react-i18next";

import { ZERO } from "@/shared/constants/shared-constants";

import type { UserLibraryEntry } from "../slice/user-library-types";

type UserLibraryCardConfirmationProps = {
	entry: UserLibraryEntry;
	isRemoving: boolean;
	songsOwnedByUser: string[];
	playlistsOwnedByUser: string[];
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Displays an inline confirmation dialog with warnings about what will be
 * removed when deleting a user from the library.
 *
 * @param entry - The user library entry being removed
 * @param isRemoving - Whether a removal operation is in progress
 * @param songsOwnedByUser - Array of song IDs owned by this user
 * @param playlistsOwnedByUser - Array of playlist IDs owned by this user
 * @param onConfirm - Callback when user confirms the removal
 * @param onCancel - Callback when user cancels the removal
 * @returns - A React element displaying the confirmation dialog
 */
export default function UserLibraryCardConfirmation({
	entry,
	isRemoving,
	songsOwnedByUser,
	playlistsOwnedByUser,
	onConfirm,
	onCancel,
}: UserLibraryCardConfirmationProps): ReactElement {
	const { t } = useTranslation();
	const displayName = entry.owner_username ?? entry.followed_user_id;

	return (
		<div className="rounded-lg border border-red-600 bg-red-900/20 p-4">
			<div className="space-y-3">
				<div>
					<h4 className="font-semibold text-red-300">
						{t("userLibrary.removeWarning", "Remove {{user}}?", { user: displayName })}
					</h4>
					<p className="mt-1 text-sm text-red-400">
						{t(
							"userLibrary.removeWarningDescription",
							"This will remove {{user}} from your user library.",
							{ user: displayName },
						)}
					</p>
					{(songsOwnedByUser.length > ZERO || playlistsOwnedByUser.length > ZERO) && (
						<div className="mt-2 space-y-1 text-sm text-red-400">
							{songsOwnedByUser.length > ZERO && (
								<p>
									{t(
										"userLibrary.removeSongsWarning",
										"This will also remove {{count}} song(s) by {{user}}.",
										{
											count: songsOwnedByUser.length,
											user: displayName,
										},
									)}
								</p>
							)}
							{playlistsOwnedByUser.length > ZERO && (
								<p>
									{t(
										"userLibrary.removePlaylistsWarning",
										"This will also remove {{count}} playlist(s) by {{user}}.",
										{
											count: playlistsOwnedByUser.length,
											user: displayName,
										},
									)}
								</p>
							)}
						</div>
					)}
				</div>

				<div className="flex gap-2">
					<button
						type="button"
						disabled={isRemoving}
						className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-600"
						onClick={onConfirm}
					>
						{isRemoving
							? t("userLibrary.removing", "Removing...")
							: t("userLibrary.confirmRemove", "Remove")}
					</button>
					<button
						type="button"
						disabled={isRemoving}
						className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
						onClick={onCancel}
					>
						{t("userLibrary.cancel", "Cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}
