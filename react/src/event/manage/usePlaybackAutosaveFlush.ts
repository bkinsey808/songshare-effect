import { useEffect } from "react";

import { apiEventSavePath } from "@/shared/paths";

type MutableRef<TValue> = { current: TValue };

type UsePlaybackAutosaveFlushArgs = {
	/** Ref to the active song autosave timeout ID. */
	songAutosaveTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | undefined>;
	/** Ref to the active slide autosave timeout ID. */
	slideAutosaveTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | undefined>;
	/** Ref to the latest event ID. */
	latestEventIdRef: MutableRef<string | undefined>;
	/** Ref to the latest song ID. */
	latestSongIdRef: MutableRef<string | undefined>;
	/** Ref to the latest slide position. */
	latestSlidePositionRef: MutableRef<number | undefined>;
};

/**
 * Flushes pending debounced playback saves when the page is unloading.
 *
 * @param songAutosaveTimeoutRef - Ref to the active song autosave timeout ID.
 * @param slideAutosaveTimeoutRef - Ref to the active slide autosave timeout ID.
 * @param latestEventIdRef - Ref to the latest event ID.
 * @param latestSongIdRef - Ref to the latest song ID.
 * @param latestSlidePositionRef - Ref to the latest slide position.
 * @returns Nothing; this hook performs side effects only
 */
export default function usePlaybackAutosaveFlush({
	songAutosaveTimeoutRef,
	slideAutosaveTimeoutRef,
	latestEventIdRef,
	latestSongIdRef,
	latestSlidePositionRef,
}: Readonly<UsePlaybackAutosaveFlushArgs>): void {
	// Flush pending playback autosave when the page is unloading.
	useEffect(() => {
		function flushPendingPlaybackAutosave(): void {
			const hasPendingSongSave = songAutosaveTimeoutRef.current !== undefined;
			const hasPendingSlideSave = slideAutosaveTimeoutRef.current !== undefined;

			if (!hasPendingSongSave && !hasPendingSlideSave) {
				return;
			}

			if (songAutosaveTimeoutRef.current !== undefined) {
				clearTimeout(songAutosaveTimeoutRef.current);
				songAutosaveTimeoutRef.current = undefined;
			}
			if (slideAutosaveTimeoutRef.current !== undefined) {
				clearTimeout(slideAutosaveTimeoutRef.current);
				slideAutosaveTimeoutRef.current = undefined;
			}

			const eventId = latestEventIdRef.current;
			if (eventId === undefined || eventId === "") {
				return;
			}

			const payload: {
				event_id: string;
				active_song_id?: string | null;
				active_slide_position?: number | null;
			} = { event_id: eventId };

			if (hasPendingSongSave) {
				/* oxlint-disable unicorn/no-null */
				payload.active_song_id = latestSongIdRef.current ?? null;
				/* oxlint-enable unicorn/no-null */
			}

			if (hasPendingSlideSave) {
				/* oxlint-disable unicorn/no-null */
				payload.active_slide_position = latestSlidePositionRef.current ?? null;
				/* oxlint-enable unicorn/no-null */
			}

			void fetch(apiEventSavePath, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				keepalive: true,
				body: JSON.stringify(payload),
			});
		}

		window.addEventListener("pagehide", flushPendingPlaybackAutosave);
		window.addEventListener("beforeunload", flushPendingPlaybackAutosave);

		return (): void => {
			flushPendingPlaybackAutosave();
			window.removeEventListener("pagehide", flushPendingPlaybackAutosave);
			window.removeEventListener("beforeunload", flushPendingPlaybackAutosave);
		};
	}, [
		latestEventIdRef,
		latestSlidePositionRef,
		latestSongIdRef,
		slideAutosaveTimeoutRef,
		songAutosaveTimeoutRef,
	]);
}
