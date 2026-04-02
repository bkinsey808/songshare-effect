import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import formatAppDate from "@/shared/utils/date/formatAppDate";

import type { SongLibraryEntry } from "../slice/song-library-types";
import useSongLibraryCard from "./useSongLibraryCard";

type SongLibraryCardProps = {
	entry: SongLibraryEntry;
};

/**
 * Render a single song library entry card and its available actions.
 *
 * @param entry - The song library entry being displayed.
 * @returns A React element for a single song library card.
 */
export default function SongLibraryCard({ entry }: SongLibraryCardProps): ReactElement {
	const { t } = useTranslation();
	const { currentUserId, handleEditSongClick, handleRemoveSongClick, viewPath } =
		useSongLibraryCard({ entry });

	return (
		<div className="group hover:bg-gray-750 rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600">
			{/* Song Title */}
			<h3 className="mb-2 line-clamp-2 font-semibold text-white">{entry.song_name}</h3>

			{/* Owner Info */}
			<div className="mb-3 flex items-center space-x-2">
				<div className="flex items-center space-x-1 text-sm text-gray-400">
					<span>👤</span>
					<span>
						{typeof entry.owner_username === "string" && entry.owner_username !== ""
							? entry.owner_username
							: t("songLibrary.unknownOwner", "Unknown User")}
					</span>
				</div>
			</div>

			{/* Added Date */}
			<div className="mb-4 text-xs text-gray-400">
				{t("songLibrary.addedOn", "Added {{date}}", {
					date: formatAppDate(entry.created_at),
				})}
			</div>

			{/* Action Buttons */}
			<div className="flex items-center justify-between gap-2">
				{entry.song_slug !== undefined && entry.song_slug.trim() !== "" ? (
					<Link
						to={viewPath}
						className="text-sm text-blue-400 transition-colors hover:text-blue-300"
					>
						{t("songLibrary.viewSong", "View Song")}
					</Link>
				) : (
					<span className="cursor-not-allowed text-sm text-gray-500">
						{t("songLibrary.viewSong", "View Song")}
					</span>
				)}
				{currentUserId !== undefined && currentUserId === entry.song_owner_id ? (
					<button
						type="button"
						className="text-sm text-green-400 transition-colors hover:text-green-300"
						onClick={handleEditSongClick}
					>
						{t("songLibrary.editSong", "Edit")}
					</button>
				) : undefined}
				{currentUserId !== undefined && currentUserId !== entry.song_owner_id ? (
					<button
						type="button"
						className="text-sm text-red-400 transition-colors hover:text-red-300"
						onClick={handleRemoveSongClick}
					>
						{t("songLibrary.removeSong", "Remove")}
					</button>
				) : undefined}
			</div>
		</div>
	);
}
