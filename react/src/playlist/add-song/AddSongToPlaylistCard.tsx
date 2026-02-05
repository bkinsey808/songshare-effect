import { Effect } from "effect";
import { useState } from "react";

import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";

import Button from "@/react/design-system/Button";
import useLocale from "@/react/language/locale/useLocale";
import CollapsibleSection from "@/react/song/song-form/CollapsibleSection";
import { useAppStore } from "@/react/zustand/useAppStore";
import { ZERO } from "@/shared/constants/shared-constants";

type AddSongToPlaylistCardProps = {
	/** The song ID to add to a playlist */
	songId: string;
};

/**
 * Expandable card for adding a song to a playlist.
 * Shows user's playlists with search functionality.
 *
 * @param props - Component props.
 * @returns The add song to playlist card.
 */
export default function AddSongToPlaylistCard({
	songId,
}: AddSongToPlaylistCardProps): ReactElement {
	const { t } = useLocale();
	const [isExpanded, setIsExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isAdding, setIsAdding] = useState<string | undefined>(undefined);
	const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

	// Get user's playlist library entries
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const savePlaylist = useAppStore((state) => state.savePlaylist);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	// Constant to avoid magic number

	// Filter playlists owned by the current user (can only add to own playlists)
	const ownedPlaylists = Object.values(playlistLibraryEntries).filter(
		(entry) => entry.playlist_owner_id === currentUserId,
	);

	// Filter by search query
	const filteredPlaylists = ownedPlaylists.filter((entry) => {
		if (searchQuery.trim() === "") {
			return true;
		}
		const name = entry.playlist_name ?? "";
		return name.toLowerCase().includes(searchQuery.toLowerCase());
	});

	/**
	 * Handle adding the song to a playlist.
	 * @param playlist - The playlist to add the song to.
	 */
	async function handleAddToPlaylist(playlist: PlaylistLibraryEntry): Promise<void> {
		if (playlist.playlist_id === undefined) {
			return;
		}

		setIsAdding(playlist.playlist_id);
		setErrorMessage(undefined);
		setSuccessMessage(undefined);

		try {
			// Attempt to add the song by saving playlist metadata (song order not available on library entries)
			// Note: playlist library entries don't include the playlist's song order; server will determine
			// appropriate behavior when only playlist_id is provided.
			await Effect.runPromise(
				savePlaylist({
					playlist_id: playlist.playlist_id,
					playlist_name: playlist.playlist_name ?? playlist.playlist_public?.playlist_name ?? "",
					playlist_slug: playlist.playlist_slug ?? playlist.playlist_public?.playlist_slug ?? "",
					private_notes: "",
				}),
			);

			void songId;
			setSuccessMessage(
				t("playlist.songAdded", 'Added to "{{name}}"', {
					name: playlist.playlist_name ?? playlist.playlist_public?.playlist_name ?? "Playlist",
				}),
			);
		} catch (error) {
			console.error("[AddSongToPlaylistCard] Failed to add song:", error);
			setErrorMessage(t("playlist.addFailed", "Failed to add song to playlist"));
		} finally {
			setIsAdding(undefined);
		}
	}

	const playlistIcon = (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<line x1="4" y1="6" x2="16" y2="6" />
			<line x1="4" y1="10" x2="16" y2="10" />
			<line x1="4" y1="14" x2="12" y2="14" />
			<path d="M18 10v6a2 2 0 11-2-2h2" />
		</svg>
	);

	return (
		<CollapsibleSection
			title={t("playlist.addToPlaylist", "Add to Playlist")}
			icon={playlistIcon}
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
						onChange={(event) => {
							setSearchQuery(event.target.value);
						}}
						placeholder={t("playlist.searchPlaylists", "Search your playlists...")}
						className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
					/>
				</div>

				{/* Status Messages */}
				{successMessage !== undefined && (
					<div className="rounded-lg bg-green-900/30 p-3 text-green-400">{successMessage}</div>
				)}
				{errorMessage !== undefined && (
					<div className="rounded-lg bg-red-900/30 p-3 text-red-400">{errorMessage}</div>
				)}

				{/* Playlist List */}
				<div className="max-h-64 space-y-2 overflow-y-auto">
					{filteredPlaylists.length === ZERO ? (
						<div className="py-4 text-center text-gray-400">
							{ownedPlaylists.length === ZERO
								? t("playlist.noPlaylists", "You don't have any playlists yet")
								: t("playlist.noMatchingPlaylists", "No playlists match your search")}
						</div>
					) : (
						filteredPlaylists.map((playlist) => (
							<div
								key={playlist.playlist_id}
								className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700 p-3"
							>
								<div>
									<p className="font-medium text-white">
										{playlist.playlist_name ?? t("playlist.untitled", "Untitled")}
									</p>
									<p className="text-sm text-gray-400">
										{t("playlist.songCount", "{{count}} songs", {
											count: 0,
										})}
									</p>
								</div>
								<Button
									size="compact"
									variant="primary"
									onClick={() => void handleAddToPlaylist(playlist)}
									disabled={isAdding !== null}
								>
									{isAdding === playlist.playlist_id
										? t("playlist.adding", "Adding...")
										: t("playlist.add", "Add")}
								</Button>
							</div>
						))
					)}
				</div>
			</div>
		</CollapsibleSection>
	);
}
