import { useEffect, useRef, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";

const PLAYLISTS_NONE = 0;

export type UsePlaylistSearchInputArgs = {
	/** Currently active playlist ID */
	activePlaylistId: string | null | undefined;
	/** Called when a playlist is selected */
	onSelect: (playlistId: string) => void;
};

export type UsePlaylistSearchInputReturn = {
	PLAYLISTS_NONE: number;
	searchQuery: string;
	setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	containerRef: React.RefObject<HTMLDivElement | null>;
	inputRef: React.RefObject<HTMLInputElement | null>;
	filteredPlaylists: readonly PlaylistLibraryEntry[];
	activePlaylist: PlaylistLibraryEntry | undefined;
	handleSelectPlaylist: (entry: PlaylistLibraryEntry) => void;
	handleClickOutside: () => void;
	handleInputFocus: () => void;
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleClearSelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
	inputDisplayValue: string;
};

/**
 * Encapsulates state and handlers for the playlist search input.
 *
 * @param activePlaylistId - Currently active playlist id (may be undefined/null)
 * @param onSelect - Called when a playlist is selected
 * @returns State, refs and handlers used by `PlaylistSearchInput`
 */
export default function usePlaylistSearchInput({
	activePlaylistId,
	onSelect,
}: UsePlaylistSearchInputArgs): UsePlaylistSearchInputReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Handle clicks outside the container to close the search dropdown
	useEffect(() => {
		/**
		 * Handle pointer events on the document and close the dropdown when the
		 * event occurs outside of the component container.
		 *
		 * @param event - The pointer event to inspect.
		 * @returns void
		 */
		function handleDocumentPointerDown(event: MouseEvent | TouchEvent): void {
			const container = containerRef.current;
			if (!container) {
				return;
			}

			const targetNode = event.target;
			if (!(targetNode instanceof Node)) {
				return;
			}

			if (!container.contains(targetNode)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleDocumentPointerDown);
		document.addEventListener("touchstart", handleDocumentPointerDown);

		return (): void => {
			document.removeEventListener("mousedown", handleDocumentPointerDown);
			document.removeEventListener("touchstart", handleDocumentPointerDown);
		};
	}, [containerRef]);

	// Get playlists from app store - extract from playlistLibraryEntries
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);

	// Convert record of playlists to array
	const userPlaylistsArray: readonly PlaylistLibraryEntry[] = Object.values(
		playlistLibraryEntries,
	).filter((entry): entry is PlaylistLibraryEntry => entry !== undefined);

	// Find active playlist
	const activePlaylist =
		activePlaylistId === undefined || activePlaylistId === null || activePlaylistId === ""
			? undefined
			: userPlaylistsArray.find((entry) => entry.playlist_id === activePlaylistId);

	// Filter playlists by search query
	const trimmedQuery = searchQuery.trim();
	const filteredPlaylists: readonly PlaylistLibraryEntry[] =
		trimmedQuery === ""
			? userPlaylistsArray
			: userPlaylistsArray.filter(
					(entry) =>
						(entry.playlist_name?.toLowerCase().includes(trimmedQuery.toLowerCase()) ?? false) ||
						(entry.playlist_slug?.toLowerCase().includes(trimmedQuery.toLowerCase()) ?? false),
				);

	/**
	 * Called when the user selects a playlist from the list.
	 *
	 * @param entry - The playlist entry selected by the user.
	 * @returns void
	 */
	function handleSelectPlaylist(entry: PlaylistLibraryEntry): void {
		onSelect(entry.playlist_id);
		setSearchQuery("");
		setIsOpen(false);
	}

	/**
	 * Close the dropdown when a non-container click occurs.
	 *
	 * @returns void
	 */
	function handleClickOutside(): void {
		setIsOpen(false);
	}

	/**
	 * Focus handler that opens the dropdown when the input receives focus.
	 *
	 * @returns void
	 */
	function handleInputFocus(): void {
		setIsOpen(true);
	}

	/**
	 * Update search query and open the dropdown when the input changes.
	 *
	 * @param event - Change event from the input element.
	 * @returns void
	 */
	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setSearchQuery(event.target.value);
		setIsOpen(true);
	}

	/**
	 * Clear the current selection and reset the input display.
	 *
	 * @param event - Click event from the clear-selection control.
	 * @returns void
	 */
	function handleClearSelection(event: React.MouseEvent<HTMLButtonElement>): void {
		event.preventDefault();
		event.stopPropagation();
		onSelect(""); // Pass empty string to clear
		setSearchQuery("");
		setIsOpen(false);
		inputRef.current?.focus();
	}

	// Calculate input display value
	let inputDisplayValue = "";
	if (searchQuery === "") {
		const playlistName = activePlaylist?.playlist_name;
		if (playlistName !== undefined && playlistName !== "") {
			inputDisplayValue = playlistName;
		}
	} else {
		inputDisplayValue = searchQuery;
	}

	return {
		PLAYLISTS_NONE,
		searchQuery,
		setSearchQuery,
		isOpen,
		setIsOpen,
		containerRef,
		inputRef,
		filteredPlaylists,
		activePlaylist,
		handleSelectPlaylist,
		handleClickOutside,
		handleInputFocus,
		handleInputChange,
		handleClearSelection,
		inputDisplayValue,
	} as const;
}
