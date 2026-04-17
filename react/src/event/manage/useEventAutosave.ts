import type { Effect as EffectRuntime } from "effect";
import { useState, type Dispatch, type SetStateAction } from "react";

import useThrottle from "@/react/lib/hooks/useThrottle";
import postJson from "@/shared/fetch/postJson";
import { apiEventSavePath } from "@/shared/paths";
import { type EventSavePayload } from "@/shared/event/event-save-schema";

import type { ActionState } from "./ActionState.type";
import refreshEvent from "./refreshEvent";
import runAction from "./runAction";

const AUTOSAVE_DEBOUNCE_MS = 250;
const FIRST_SLIDE_POSITION = 1;

export type UseEventAutosaveArgs = {
	/** slug used when refreshing the event after a save */
	event_slug: string | undefined;
	/** effect that fetches an event by slug */
	fetchEventBySlug: (slug: string) => EffectRuntime.Effect<void, unknown>;
	/** mutable ref containing the latest event id (duck-typed) */
	currentEventIdRef: { current: string | undefined };
	/** ref used by callers to keep track of the last slide position */
	latestSlidePositionRef: { current: number | undefined };
	/** updater for the actionState object owned by the parent hook */
	setActionState: Dispatch<SetStateAction<ActionState>>;
};

export type UseEventAutosaveResult = {
	selectedActiveSongId: string | undefined;
	selectedActiveSlidePosition: number | undefined;
	/** setters are exposed so callers can integrate with other hooks */
	setSelectedSongId: (id: string | undefined) => void;
	setSelectedSlidePosition: (pos: number | undefined) => void;
	updateActiveSong: (songId: string) => void;
	updateActiveSlidePosition: (slidePosition: number | undefined) => void;
	throttledSongSaveFlush: () => void;
	throttledSlideSaveFlush: () => void;
};

/**
 * Encapsulates the playback autosave logic that lived in
 * `useEventManageState` prior to refactoring. The hook is intentionally
 * independent of the global store so it can be tested in isolation.
 *
 * @param event_slug - slug used when refreshing the event after a save
 * @param fetchEventBySlug - effect to fetch an event by slug
 * @param currentEventIdRef - mutable ref containing the latest event id
 * @param latestSlidePositionRef - ref tracking last slide position
 * @param setActionState - updater for parent action state object
 * @returns hooks for managing autosave selections and flush operations
 */
export default function useEventAutosave({
    event_slug,
    fetchEventBySlug,
    currentEventIdRef,
    latestSlidePositionRef,
    setActionState,
}: UseEventAutosaveArgs): UseEventAutosaveResult {
	const [selectedActiveSongId, setSelectedActiveSongId] = useState<string | undefined>(undefined);
	const [selectedActiveSlidePosition, setSelectedActiveSlidePosition] = useState<
		number | undefined
	>(undefined);

	/**
	 * Sends the active song save action to the backend.
	 *
	 * @param songId - song id to set, or undefined to clear
	 * @returns void
	 */
	function sendSongSave(songId: string | undefined): void {
		const shouldSetFirstSlide = songId !== "" && latestSlidePositionRef.current === undefined;
		const payload: EventSavePayload = {
			event_id: currentEventIdRef.current ?? "",
			/* oxlint-disable-next-line unicorn/no-null */
			active_song_id: songId === "" || songId === undefined ? null : songId,
			...(shouldSetFirstSlide ? { active_slide_position: FIRST_SLIDE_POSITION } : {}),
		};

		void runAction({
			actionKey: "song",
			successMessage: "Active song updated",
			action: () => postJson(apiEventSavePath, payload),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	/**
	 * Sends the active slide position save action to the backend.
	 *
	 * @param slidePosition - the 1-based slide position or undefined to clear
	 * @returns void
	 */
	function sendSlideSave(slidePosition: number | undefined): void {
		const payload: EventSavePayload = {
			event_id: currentEventIdRef.current ?? "",
			/* oxlint-disable-next-line unicorn/no-null */
			active_slide_position: slidePosition === undefined ? null : slidePosition,
		};
		void runAction({
			actionKey: "slide",
			successMessage: "Active slide position updated",
			action: () => postJson(apiEventSavePath, payload),
			setActionState,
			refreshFn: () => refreshEvent(event_slug, fetchEventBySlug),
		});
	}

	const { throttled: throttledSongSave, flush: throttledSongSaveFlush } = useThrottle<
		[string | undefined]
	>(sendSongSave, AUTOSAVE_DEBOUNCE_MS);
	const { throttled: throttledSlideSave, flush: throttledSlideSaveFlush } = useThrottle<
		[number | undefined]
	>(sendSlideSave, AUTOSAVE_DEBOUNCE_MS);

	/**
	 * Update local selected song state and schedule a throttled autosave.
	 *
	 * @param songId - the selected song id (empty string clears)
	 * @returns void
	 */
	function updateActiveSong(songId: string): void {
		const shouldSetFirstSlide = songId !== "" && selectedActiveSlidePosition === undefined;
		if (shouldSetFirstSlide) {
			latestSlidePositionRef.current = FIRST_SLIDE_POSITION;
		}

		setSelectedActiveSongId(songId);
		if (shouldSetFirstSlide) {
			setSelectedActiveSlidePosition(FIRST_SLIDE_POSITION);
		}

		throttledSongSave(songId === "" ? undefined : songId);
	}

	/**
	 * Update local selected slide position state and schedule a throttled autosave.
	 *
	 * @param slidePosition - new slide position or undefined to clear
	 * @returns void
	 */
	function updateActiveSlidePosition(slidePosition: number | undefined): void {
		latestSlidePositionRef.current = slidePosition;
		setSelectedActiveSlidePosition(slidePosition);

		throttledSlideSave(slidePosition);
	}

	return {
		selectedActiveSongId,
		selectedActiveSlidePosition,
		setSelectedSongId: setSelectedActiveSongId,
		setSelectedSlidePosition: setSelectedActiveSlidePosition,
		updateActiveSong,
		updateActiveSlidePosition,
		throttledSongSaveFlush,
		throttledSlideSaveFlush,
	};
}
