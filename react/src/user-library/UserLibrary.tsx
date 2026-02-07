import { useTranslation } from "react-i18next";

import useCurrentUserId from "@/react/auth/useCurrentUserId";
import { ZERO } from "@/shared/constants/shared-constants";

import UserLibraryCard from "./card/UserLibraryCard";
import AddUserForm from "./user-add/AddUserForm";
import UserLibraryEmptyState from "./UserLibraryEmptyState";
import UserLibraryErrorState from "./UserLibraryErrorState";
import UserLibraryLoadingState from "./UserLibraryLoadingState";
import useUserLibrary from "./useUserLibrary";

/**
 * Main component for the user library page. Displays the current user's followed
 * users and allows them to remove individual entries and all associated songs/playlists.
 *
 * @returns - A React element that displays loading, error, empty, or library states
 */
export default function UserLibrary(): ReactElement {
	const { entries, isLoading, error, songLibraryEntries, playlistLibraryEntries } =
		useUserLibrary();
	const currentUserId = useCurrentUserId();
	const { t } = useTranslation();

	if (isLoading) {
		return <UserLibraryLoadingState />;
	}

	if (typeof error === "string" && error !== "") {
		return <UserLibraryErrorState error={error} />;
	}

	if (entries.length === ZERO) {
		return <UserLibraryEmptyState />;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-white">
						{t("userLibrary.title", "My User Library")}
					</h2>
					<span className="text-sm text-gray-400">
						{t("userLibrary.count", "{{count}} users", { count: entries.length })}
					</span>
				</div>
				<AddUserForm />
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{entries.map((entry) => {
					const songsOwnedByUser = Object.entries(songLibraryEntries)
						.filter(([, songEntry]) => songEntry.song_owner_id === entry.followed_user_id)
						.map(([songId]) => songId);
					const playlistsOwnedByUser = Object.entries(playlistLibraryEntries)
						.filter(
							([, playlistEntry]) => playlistEntry.playlist_owner_id === entry.followed_user_id,
						)
						.map(([playlistId]) => playlistId);

					return (
						<UserLibraryCard
							key={entry.followed_user_id}
							entry={entry}
							{...(currentUserId !== undefined && currentUserId !== "" ? { currentUserId } : {})}
							songsOwnedByUser={songsOwnedByUser}
							playlistsOwnedByUser={playlistsOwnedByUser}
						/>
					);
				})}
			</div>
		</div>
	);
}
