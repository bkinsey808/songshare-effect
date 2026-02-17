import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import useActiveSongSelectionState from "./useActiveSongSelectionState";

type ActiveSongSelectionSectionProps = {
	activePlaylistId: string | null | undefined;
	activeSongId: string | null | undefined;
	activeSlideId: string | null | undefined;
	onSelectActiveSong: (songId: string) => void;
	onSelectActiveSlide: (slideId: string) => void;
};

/**
 * Renders active song selection UI and empty-state helper text for the selected playlist.
 *
 * @param activePlaylistId - Currently selected playlist ID
 * @param activeSongId - Currently selected active song ID
 * @param activeSlideId - Currently selected active slide ID
 * @param onSelectActiveSong - Song selection handler
 * @param onSelectActiveSlide - Slide selection handler
 * @returns Active song selection section UI
 */
export default function ActiveSongSelectionSection({
	activePlaylistId,
	activeSongId,
	activeSlideId,
	onSelectActiveSong,
	onSelectActiveSlide,
}: ActiveSongSelectionSectionProps): ReactElement {
	const { t } = useTranslation();
	const {
		hasSelectedPlaylist,
		hasPlaylistSongs,
		hasNoPlaylistSongs,
		hasSelectedSong,
		hasSongSlides,
		hasNoSongSlides,
		availablePlaylistSongs,
		availableSongSlidePositions,
	} = useActiveSongSelectionState({
		activePlaylistId,
		activeSongId,
	});

	return (
		<>
			{hasSelectedPlaylist && hasPlaylistSongs && (
				<fieldset>
					<legend className="mb-2 block text-sm font-medium text-white">
						{t("eventEdit.activeSong", "Active Song")}
					</legend>
					<div className="space-y-2 rounded-lg border border-gray-600 bg-gray-800 p-3">
						{availablePlaylistSongs.map((song) => (
							<label
								key={song.songId}
								className="flex cursor-pointer items-center gap-2 text-sm text-white"
							>
								<input
									type="radio"
									name="active_song_id"
									value={song.songId}
									checked={activeSongId === song.songId}
									onChange={() => {
										onSelectActiveSong(song.songId);
									}}
									className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-500"
								/>
								<span>{song.songName}</span>
							</label>
						))}
					</div>
				</fieldset>
			)}

			{hasSelectedPlaylist && hasNoPlaylistSongs && (
				<p className="-mt-4 text-xs text-gray-400">
					{t("eventEdit.noSongsInPlaylistHint", "No songs in this playlist")}
				</p>
			)}

			{hasSelectedSong && hasSongSlides && (
				<fieldset>
					<legend className="mb-2 block text-sm font-medium text-white">
						{t("eventEdit.activeSlidePosition", "Active Slide Position")}
					</legend>
					<div className="space-y-2 rounded-lg border border-gray-600 bg-gray-800 p-3">
						{availableSongSlidePositions.map((slide) => (
							<label
								key={slide.slideId}
								className="flex cursor-pointer items-center gap-2 text-sm text-white"
							>
								<input
									type="radio"
									name="active_slide_id"
									value={slide.slideId}
									checked={activeSlideId === slide.slideId}
									onChange={() => {
										onSelectActiveSlide(slide.slideId);
									}}
									className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-500"
								/>
								<span>
									{t("eventEdit.slidePositionLabel", "Slide {{position}}", {
										position: slide.position,
									})}
								</span>
							</label>
						))}
					</div>
				</fieldset>
			)}

			{hasSelectedSong && hasNoSongSlides && (
				<p className="-mt-4 text-xs text-gray-400">
					{t("eventEdit.noSlidesInSongHint", "No slides in this song")}
				</p>
			)}
		</>
	);
}
