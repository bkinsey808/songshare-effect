import { useEffect, useRef } from "react";

import type { EventPublic } from "@/react/event/event-types";

/**
 * Clears any locally-selected song/slide when the authoritative `eventPublic`
 * playback fields change. This helps keep multiple browser tabs in sync.
 *
 * @param eventPublic - current public event payload (may be undefined)
 * @param selectedSongId - local song selection, or undefined if none
 * @param selectedSlidePosition - local slide selection position, or undefined
 * @param setSelectedSongId - setter to clear/update song choice
 * @param setSelectedSlidePosition - setter to clear/update slide choice
 * @returns void
 */
export default function usePlaybackSelectionSync({
	eventPublic,
	selectedSongId,
	selectedSlidePosition,
	setSelectedSongId,
	setSelectedSlidePosition,
}: {
	eventPublic: EventPublic | undefined;
	selectedSongId: string | undefined;
	selectedSlidePosition: number | undefined;
	setSelectedSongId: (id: string | undefined) => void;
	setSelectedSlidePosition: (pos: number | undefined) => void;
}): void {
	// keep track of the last playback fields we observed; we intentionally
	// ignore the full `eventPublic` object because unrelated updates can
	// produce a new reference even when the song/slide values haven't
	// changed. the previous implementation compared references and would
	// clear any local choice if `eventPublic` changed for any reason, which
	// caused the flash/revert bug reported by the user.
	const prevPlaybackRef = useRef<
		| {
				songId: string | undefined;
				slidePos: number | undefined;
		  }
		| undefined
	>(undefined);

	// watch for changes to active song/slide and clear mismatched local
	// picks. we ignore non-playback modifications by tracking only the
	// playback fields.
	useEffect(() => {
		if (!eventPublic) {
			// reset when eventPublic becomes undefined
			prevPlaybackRef.current = undefined;
			return;
		}

		const currentPlayback = {
			songId: eventPublic.active_song_id,
			slidePos: eventPublic.active_slide_position,
		};

		// bail if neither the active song nor slide changed since last time
		if (
			prevPlaybackRef.current &&
			prevPlaybackRef.current.songId === currentPlayback.songId &&
			prevPlaybackRef.current.slidePos === currentPlayback.slidePos
		) {
			return;
		}

		// only clear selections when the authoritative playback state drifts
		if (selectedSongId !== undefined && currentPlayback.songId !== selectedSongId) {
			setSelectedSongId(undefined);
		}
		if (selectedSlidePosition !== undefined && currentPlayback.slidePos !== selectedSlidePosition) {
			setSelectedSlidePosition(undefined);
		}

		prevPlaybackRef.current = currentPlayback;
	}, [
		eventPublic,
		selectedSongId,
		selectedSlidePosition,
		setSelectedSongId,
		setSelectedSlidePosition,
	]);
}
