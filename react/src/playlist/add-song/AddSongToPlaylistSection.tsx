import { useState } from "react";

import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";

import useAppStore from "@/react/app-store/useAppStore";
import Button from "@/react/design-system/Button";
import useLocale from "@/react/language/locale/useLocale";
import CollapsibleSection from "@/react/song/song-form/CollapsibleSection";

type AddSongToPlaylistSectionProps = {
	/** Current song IDs already in the playlist */
	currentSongOrder: string[];
	/** Callback when a song is added to the playlist */
	onSongAdded: (songId: string) => void;
};

const SONGS_NONE = 0;
const SEARCH_QUERY_EMPTY = "";

/**
 * Expandable section for adding songs to the current playlist.
 * Shows user's song library with search functionality.
 *
 * @param props - Component props.
 * @returns The add song to playlist section.
 */
export default function AddSongToPlaylistSection({
	currentSongOrder,
	onSongAdded,
}: AddSongToPlaylistSectionProps): ReactElement {
	const { t } = useLocale();
	const [isExpanded, setIsExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Get user's song library entries
	const songLibraryEntries = useAppStore((state) => state.songLibraryEntries);

	// Filter songs not already in the playlist
	const availableSongs = Object.values(songLibraryEntries).filter(
		(entry) => !currentSongOrder.includes(entry.song_id),
	);

	// Filter by search query
	const filteredSongs = availableSongs.filter((entry) => {
		if (searchQuery.trim() === "") {
			return true;
		}
		const name = entry.song_name ?? "";
		return name.toLowerCase().includes(searchQuery.toLowerCase());
	});

	/**
	 * Handle adding a song to the playlist.
	 * @param song - The song to add.
	 */
	function handleAddSong(song: SongLibraryEntry): void {
		onSongAdded(song.song_id);
	}

	const addIcon = (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);

	return (
		<CollapsibleSection
			title={t("playlist.addSongs", "Add Songs")}
			icon={addIcon}
			isExpanded={isExpanded}
			onToggle={() => {
				setIsExpanded(!isExpanded);
			}}
		>
			<div className="space-y-4">
				{/* Search Input */}
				<div>
					<input
						type="text"
						value={searchQuery}
						onChange={(ev) => {
							setSearchQuery(ev.target.value);
						}}
						placeholder={t("playlist.searchSongs", "Search your song library...")}
						className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
					/>
				</div>

				{/* Info about current playlist */}
				<div className="text-sm text-gray-400">
					{t("playlist.songsInPlaylist", "{{count}} songs already in this playlist", {
						count: currentSongOrder.length,
					})}
				</div>

				{/* Song List */}
				<div className="max-h-64 space-y-2 overflow-y-auto">
					{filteredSongs.length === SONGS_NONE ? (
						<div className="py-4 text-center text-gray-400">
							{availableSongs.length === SONGS_NONE
								? t("playlist.allSongsAdded", "All songs from your library are in this playlist")
								: t("playlist.noMatchingSongs", "No songs match your search")}
						</div>
					) : (
						filteredSongs.map((song) => (
							<div
								key={song.song_id}
								className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700 p-3"
							>
								<div>
									<p className="font-medium text-white">
										{song.song_name ?? t("playlist.untitledSong", "Untitled Song")}
									</p>
									{song.owner_username !== undefined && (
										<p className="text-sm text-gray-400">
											{t("playlist.by", "by {{username}}", {
												username: song.owner_username,
											})}
										</p>
									)}
								</div>
								<Button
									size="compact"
									variant="primary"
									onClick={() => {
										handleAddSong(song);
									}}
								>
									{t("playlist.add", "Add")}
								</Button>
							</div>
						))
					)}
				</div>

				{/* Recent songs section */}
				{availableSongs.length > SONGS_NONE && searchQuery.trim() === SEARCH_QUERY_EMPTY && (
					<div className="text-xs text-gray-500">
						{t("playlist.showingAvailable", "Showing {{count}} available songs", {
							count: availableSongs.length,
						})}
					</div>
				)}
			</div>
		</CollapsibleSection>
	);
}
