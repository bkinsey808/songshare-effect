import useAppStore from "@/react/app-store/useAppStore";
import isRecord from "@/shared/type-guards/isRecord";

type PlaylistSongOption = {
	songId: string;
	songName: string;
};

type SongSlidePositionOption = {
	slideId: string;
	position: number;
};

type UseActiveSongSelectionStateArgs = {
	activePlaylistId: string | null | undefined;
	activeSongId: string | null | undefined;
};

type UseActiveSongSelectionStateReturn = {
	availablePlaylistSongs: readonly PlaylistSongOption[];
	availableSongSlidePositions: readonly SongSlidePositionOption[];
	hasSelectedPlaylist: boolean;
	hasPlaylistSongs: boolean;
	hasNoPlaylistSongs: boolean;
	hasSelectedSong: boolean;
	hasSongSlides: boolean;
	hasNoSongSlides: boolean;
};

const SONGS_NONE = 0;
const SLIDE_POSITION_OFFSET = 1;

/**
 * Derives active song selection UI state.
 *
 * @param activePlaylistId - Currently selected playlist ID
 * @returns Active song options and derived booleans for section rendering states
 */
export default function useActiveSongSelectionState({
	activePlaylistId,
	activeSongId,
}: UseActiveSongSelectionStateArgs): UseActiveSongSelectionStateReturn {
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const publicSongs = useAppStore((state) => state.publicSongs);

	const hasSelectedPlaylist = activePlaylistId !== undefined && activePlaylistId !== "";
	const selectedPlaylistSongOrder: readonly string[] =
		hasSelectedPlaylist &&
		currentPlaylist?.playlist_id === activePlaylistId &&
		Array.isArray(currentPlaylist.public?.song_order)
			? currentPlaylist.public.song_order
			: [];

	const availablePlaylistSongs: readonly PlaylistSongOption[] = selectedPlaylistSongOrder.map(
		(songId): PlaylistSongOption => {
			const publicSong = publicSongs[songId];
			const songName =
				publicSong?.song_name !== undefined && publicSong.song_name !== ""
					? publicSong.song_name
					: songId;
			return { songId, songName };
		},
	);
	const hasPlaylistSongs = availablePlaylistSongs.length > SONGS_NONE;
	const hasNoPlaylistSongs = hasSelectedPlaylist && !hasPlaylistSongs;

	const hasSelectedSong = typeof activeSongId === "string" && activeSongId !== "";
	const selectedPublicSong: unknown = hasSelectedSong ? publicSongs[activeSongId] : undefined;
	const slideOrderValue: unknown =
		isRecord(selectedPublicSong) && Array.isArray(selectedPublicSong["slide_order"])
			? selectedPublicSong["slide_order"]
			: [];
	const selectedSongSlideOrder: readonly string[] = Array.isArray(slideOrderValue)
		? slideOrderValue.filter((slideId): slideId is string => typeof slideId === "string")
		: [];
	const availableSongSlidePositions: readonly SongSlidePositionOption[] =
		selectedSongSlideOrder.map(
			(slideId, index): SongSlidePositionOption => ({
				slideId,
				position: index + SLIDE_POSITION_OFFSET,
			}),
		);
	const hasSongSlides = availableSongSlidePositions.length > SONGS_NONE;
	const hasNoSongSlides = hasSelectedSong && !hasSongSlides;

	return {
		availablePlaylistSongs,
		availableSongSlidePositions,
		hasSelectedPlaylist,
		hasPlaylistSongs,
		hasNoPlaylistSongs,
		hasSelectedSong,
		hasSongSlides,
		hasNoSongSlides,
	};
}
