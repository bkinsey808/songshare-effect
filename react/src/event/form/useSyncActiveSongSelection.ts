import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

import type { EventFormValues } from "../event-types";

type UseSyncActiveSongSelectionArgs = {
	formValues: EventFormValues;
	setFormValuesState: React.Dispatch<React.SetStateAction<EventFormValues>>;
};

/**
 * Keeps active song selection in sync with selected playlist data.
 *
 * Fetches selected playlist songs and defaults active_song_id to the first track
 * when no valid active song is currently selected.
 *
 * @param formValues - Current event form values
 * @param setFormValuesState - State setter for event form values
 * @returns Nothing
 */
export default function useSyncActiveSongSelection({
	formValues,
	setFormValuesState,
}: UseSyncActiveSongSelectionArgs): void {
	const fetchPlaylistById = useAppStore((state) => state.fetchPlaylistById);
	const currentPlaylist = useAppStore((state) => state.currentPlaylist);
	const publicSongs = useAppStore((state) => state.publicSongs);

	const selectedPlaylistId = formValues.active_playlist_id;
	const hasSelectedPlaylistId = typeof selectedPlaylistId === "string" && selectedPlaylistId !== "";
	const selectedPlaylistSongOrder: readonly string[] =
		hasSelectedPlaylistId &&
		currentPlaylist?.playlist_id === selectedPlaylistId &&
		Array.isArray(currentPlaylist.public?.song_order)
			? currentPlaylist.public.song_order
			: [];
	const selectedPlaylistSongOrderKey = selectedPlaylistSongOrder.join(",");

	// Fetches selected playlist songs so active song options can be derived elsewhere.
	useEffect(() => {
		if (!hasSelectedPlaylistId) {
			return;
		}

		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchPlaylistById(selectedPlaylistId));
			} catch (error: unknown) {
				console.error("[useSyncActiveSongSelection] Failed to fetch selected playlist:", error);
			}
		})();
	}, [hasSelectedPlaylistId, selectedPlaylistId, fetchPlaylistById]);

	// Defaults active_song_id to the first track when no valid active song is selected.
	useEffect(() => {
		if (!hasSelectedPlaylistId) {
			return;
		}

		const songOrder =
			selectedPlaylistSongOrderKey === "" ? [] : selectedPlaylistSongOrderKey.split(",");
		const [firstSongId] = songOrder;
		if (firstSongId === undefined) {
			return;
		}

		const activeSongId = formValues.active_song_id;
		const hasActiveSong = activeSongId !== undefined && activeSongId !== "";
		const isActiveSongInPlaylist = hasActiveSong && songOrder.includes(activeSongId ?? "");

		if (!hasActiveSong || !isActiveSongInPlaylist) {
			setFormValuesState((previous) => ({ ...previous, active_song_id: firstSongId }));
		}
	}, [
		hasSelectedPlaylistId,
		selectedPlaylistSongOrderKey,
		formValues.active_song_id,
		setFormValuesState,
	]);

	const selectedSongId = formValues.active_song_id;
	const hasSelectedSongId = typeof selectedSongId === "string" && selectedSongId !== "";
	const selectedSongSlideOrder: readonly string[] =
		hasSelectedSongId && Array.isArray(publicSongs[selectedSongId]?.slide_order)
			? publicSongs[selectedSongId]?.slide_order
			: [];
	const selectedSongSlideOrderKey = selectedSongSlideOrder.join(",");

	// Defaults active_slide_id to the first slide when no valid active slide is selected.
	useEffect(() => {
		if (!hasSelectedSongId) {
			return;
		}

		const slideOrder = selectedSongSlideOrderKey === "" ? [] : selectedSongSlideOrderKey.split(",");
		const [firstSlideId] = slideOrder;
		if (firstSlideId === undefined) {
			return;
		}

		const activeSlideId = formValues.active_slide_id;
		const hasActiveSlide = activeSlideId !== undefined && activeSlideId !== "";
		const isActiveSlideInSong = hasActiveSlide && slideOrder.includes(activeSlideId ?? "");

		if (!hasActiveSlide || !isActiveSlideInSong) {
			setFormValuesState((previous) => ({ ...previous, active_slide_id: firstSlideId }));
		}
	}, [
		hasSelectedSongId,
		selectedSongSlideOrderKey,
		formValues.active_slide_id,
		setFormValuesState,
	]);
}
