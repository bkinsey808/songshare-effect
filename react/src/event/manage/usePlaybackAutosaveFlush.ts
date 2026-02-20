import { useEffect } from "react";

import { apiEventSavePath } from "@/shared/paths";

type MutableRef<TValue> = { current: TValue };

type UsePlaybackAutosaveFlushArgs = {
	songAutosaveTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | undefined>;
	slideAutosaveTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | undefined>;
	latestEventIdRef: MutableRef<string | undefined>;
	latestSongIdRef: MutableRef<string | undefined>;
	latestSlidePositionRef: MutableRef<number | undefined>;
};

/**
 * Flushes pending debounced playback saves when the page is unloading.
 *
 * @param args - Timeout and latest-value refs used to build a keepalive save payload
 * @returns Nothing; this hook performs side effects only
 */
export default function usePlaybackAutosaveFlush(
	args: Readonly<UsePlaybackAutosaveFlushArgs>,
): void {
	const {
		songAutosaveTimeoutRef,
		slideAutosaveTimeoutRef,
		latestEventIdRef,
		latestSongIdRef,
		latestSlidePositionRef,
	} = args;

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
