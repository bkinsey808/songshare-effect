import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";

import usePlaylistSearchInput from "./usePlaylistSearchInput";

export type PlaylistSearchInputProps = {
	/** Currently active playlist ID */
	activePlaylistId: string | null | undefined;
	/** Called when a playlist is selected */
	onSelect: (playlistId: string) => void;
	/** Label for the input field */
	label?: string;
	/** Placeholder text for the search input */
	placeholder?: string;
	/** CSS classes for the container */
	containerClassName?: string;
};

/**
 * Inline playlist search input with dropdown selection.
 *
 * Allows users to search their playlists in real-time and select one.
 * The dropdown is shown inline (not as a modal) and appears as the user types.
 *
 * @param activePlaylistId - The currently active playlist ID
 * @param onSelect - Callback when user selects a playlist
 * @param label - Label text for the input
 * @param placeholder - Placeholder text for the search input
 * @param containerClassName - CSS class for the root container
 * @returns The playlist search input UI
 */
export default function PlaylistSearchInput({
	activePlaylistId,
	onSelect,
	label = "Active Playlist",
	placeholder = "Search playlists...",
	containerClassName = "",
}: PlaylistSearchInputProps): ReactElement {
	const {
		PLAYLISTS_NONE,
		searchQuery,
		isOpen,
		containerRef,
		inputRef,
		filteredPlaylists,
		handleSelectPlaylist,
		handleInputFocus,
		handleInputChange,
		handleClearSelection,
		inputDisplayValue,
	} = usePlaylistSearchInput({ activePlaylistId, onSelect });

	return (
		<div ref={containerRef} className={`relative ${containerClassName}`}>
			<label className="mb-2 block text-sm font-medium text-white">{label}</label>

			<div className="relative">
				{/* Input field */}
				<input
					ref={inputRef}
					type="text"
					value={inputDisplayValue}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					placeholder={placeholder}
					className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
				/>

				{/* Clear button - shown when a playlist is active */}
				{activePlaylistId !== undefined &&
					activePlaylistId !== null &&
					activePlaylistId !== "" &&
					!searchQuery && (
						<button
							type="button"
							onClick={handleClearSelection}
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 hover:text-white"
							title="Clear selection"
						>
							✕
						</button>
					)}

				{/* Dropdown menu */}
				{isOpen && filteredPlaylists.length > PLAYLISTS_NONE && (
					<div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 py-1 shadow-lg">
						{filteredPlaylists.map((entry: PlaylistLibraryEntry) => {
							const playlistName =
								entry.playlist_name !== undefined && entry.playlist_name !== ""
									? entry.playlist_name
									: "Unnamed";
							const playlistSlug =
								entry.playlist_slug !== undefined && entry.playlist_slug !== ""
									? entry.playlist_slug
									: "no-slug";
							return (
								<button
									key={entry.playlist_id}
									type="button"
									onClick={() => {
										handleSelectPlaylist(entry);
									}}
									className={`block w-full px-4 py-2 text-left hover:bg-gray-700 ${
										activePlaylistId === entry.playlist_id ? "bg-blue-600" : ""
									}`}
								>
									<div className="font-medium text-white">{playlistName}</div>
									<div className="text-xs text-gray-400">{playlistSlug}</div>
								</button>
							);
						})}
					</div>
				)}

				{/* No results message */}
				{isOpen && searchQuery && filteredPlaylists.length === PLAYLISTS_NONE && (
					<div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-gray-400">
						No playlists found matching &ldquo;{searchQuery}&rdquo;
					</div>
				)}
			</div>
		</div>
	);
}
