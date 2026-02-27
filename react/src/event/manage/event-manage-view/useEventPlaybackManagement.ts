import type { Effect } from "effect";

import { useEffect, useRef, useState } from "react";

import type { EventEntry } from "@/react/event/event-types";

import type { ActionState } from "../ActionState.type";

import useEventAutosave from "../useEventAutosave";
import usePlaybackAutosaveFlush from "../usePlaybackAutosaveFlush";
import usePlaybackSelectionSync from "../usePlaybackSelectionSync";

type UseEventPlaybackManagementProps = {
	readonly event_slug: string | undefined;
	readonly fetchEventBySlug: (slug: string) => Effect.Effect<void, unknown>;
	readonly eventPublic: EventEntry["public"] | undefined;
	readonly currentEventIdRef: React.RefObject<string | undefined>;
	readonly setActionState: React.Dispatch<React.SetStateAction<ActionState>>;
};

type UseEventPlaybackManagementReturn = {
	readonly selectedActivePlaylistId: string | undefined;
	readonly setSelectedActivePlaylistId: React.Dispatch<React.SetStateAction<string | undefined>>;
	readonly activePlaylistIdForSelector: string | undefined;
	readonly activeSongIdForSelector: string | undefined;
	readonly activeSlidePositionForSelector: number | undefined;
	readonly updateActiveSong: (songId: string) => void;
	readonly updateActiveSlidePosition: (slidePosition: number | undefined) => void;
};

/**
 * Hook to manage playback-related state, refs, and sync for an event.
 */
export default function useEventPlaybackManagement({
	event_slug,
	fetchEventBySlug,
	eventPublic,
	currentEventIdRef,
	setActionState,
}: UseEventPlaybackManagementProps): UseEventPlaybackManagementReturn {
	const [selectedActivePlaylistId, setSelectedActivePlaylistId] = useState<string | undefined>(
		undefined,
	);
	const latestSlidePositionRef = useRef<number | undefined>(undefined);

	// playback autosave logic
	const {
		selectedActiveSongId,
		selectedActiveSlidePosition,
		setSelectedSongId,
		setSelectedSlidePosition,
		updateActiveSong,
		updateActiveSlidePosition,
		throttledSongSaveFlush,
		throttledSlideSaveFlush,
	} = useEventAutosave({
		event_slug,
		fetchEventBySlug,
		currentEventIdRef,
		latestSlidePositionRef,
		setActionState,
	});

	// flush callbacks ensure any pending throttled updates are sent on unload
	usePlaybackAutosaveFlush({
		flushSong: throttledSongSaveFlush,
		flushSlide: throttledSlideSaveFlush,
	});

	const activePlaylistIdForSelector =
		selectedActivePlaylistId ?? eventPublic?.active_playlist_id ?? undefined;
	const activeSongIdForSelector = selectedActiveSongId ?? eventPublic?.active_song_id ?? undefined;
	const activeSlidePositionForSelector =
		selectedActiveSlidePosition ?? eventPublic?.active_slide_position ?? undefined;

	// sync slide position ref
	useEffect(() => {
		latestSlidePositionRef.current = activeSlidePositionForSelector;
	}, [activeSlidePositionForSelector]);

	// sync song/slide selections
	usePlaybackSelectionSync({
		eventPublic,
		selectedSongId: selectedActiveSongId,
		selectedSlidePosition: selectedActiveSlidePosition,
		setSelectedSongId,
		setSelectedSlidePosition,
	});

	return {
		selectedActivePlaylistId,
		setSelectedActivePlaylistId,
		activePlaylistIdForSelector,
		activeSongIdForSelector,
		activeSlidePositionForSelector,
		updateActiveSong,
		updateActiveSlidePosition,
	};
}
