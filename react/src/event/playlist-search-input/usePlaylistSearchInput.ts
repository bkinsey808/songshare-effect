import { useEffect, useRef, useState } from "react";

import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";

import useAppStore from "@/react/app-store/useAppStore";

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
 * @param args - Hook arguments
 * @returns - State, refs and handlers used by `PlaylistSearchInput`
 */
export default function usePlaylistSearchInput({
	activePlaylistId,
	onSelect,
}: UsePlaylistSearchInputArgs): UsePlaylistSearchInputReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
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

	// Handle playlist selection
	function handleSelectPlaylist(entry: PlaylistLibraryEntry): void {
		onSelect(entry.playlist_id);
		setSearchQuery("");
		setIsOpen(false);
	}

	// Handle click outside to close dropdown
	function handleClickOutside(): void {
		setIsOpen(false);
	}

	// Handle input focus
	function handleInputFocus(): void {
		setIsOpen(true);
	}

	// Handle input change
	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		setSearchQuery(event.target.value);
		setIsOpen(true);
	}

	// Clear selection
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
