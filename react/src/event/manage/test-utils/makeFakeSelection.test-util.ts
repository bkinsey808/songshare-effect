import type useActiveSongSelectionState from "@/react/event/form/useActiveSongSelectionState";

/**
 * Fake data for `useActiveSongSelectionState`.
 *
 * @param overrides - partial payload to merge
 */
export default function makeFakeSelection(
	overrides: Partial<ReturnType<typeof useActiveSongSelectionState>> = {},
): ReturnType<typeof useActiveSongSelectionState> {
	const base: ReturnType<typeof useActiveSongSelectionState> = {
		availablePlaylistSongs: [
			{ songId: "s1", songName: "Song 1" },
			{ songId: "s2", songName: "Song 2" },
		],
		availableSongSlidePositions: [
			{ slideId: "sl1", position: 1, slideName: "First" },
			{ slideId: "sl2", position: 2, slideName: "Second" },
		],
		hasSelectedPlaylist: true,
		hasPlaylistSongs: true,
		hasNoPlaylistSongs: false,
		hasSelectedSong: true,
		hasSongSlides: true,
		hasNoSongSlides: false,
	};
	return { ...base, ...overrides };
}
