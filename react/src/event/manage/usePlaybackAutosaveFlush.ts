import { useEffect } from "react";

/**
 * Arguments for playback autosave flush hook.
 *
 * The hook calls the supplied functions when the page is unloading or the
 * component unmounts.  It does not attempt to interpret any of the hooks
 * internal state (that responsibility belongs to the caller, e.g. a throttle
 * helper).
 */
type UsePlaybackAutosaveFlushArgs = {
	/** invoked to flush any pending song update */
	flushSong: () => void;
	/** invoked to flush any pending slide update */
	flushSlide: () => void;
};

/**
 * Flushes pending debounced playback saves when the page is unloading.
 *
 * @param flushSong - callback to run for song data
 * @param flushSlide - callback to run for slide data
 */
export default function usePlaybackAutosaveFlush({
	flushSong,
	flushSlide,
}: Readonly<UsePlaybackAutosaveFlushArgs>): void {
	// run supplied flush callbacks when the page is unloading or component unmounts
	useEffect(() => {
		function flushPendingPlaybackAutosave(): void {
			flushSong();
			flushSlide();
		}

		window.addEventListener("pagehide", flushPendingPlaybackAutosave);
		window.addEventListener("beforeunload", flushPendingPlaybackAutosave);

		return (): void => {
			flushPendingPlaybackAutosave();
			window.removeEventListener("pagehide", flushPendingPlaybackAutosave);
			window.removeEventListener("beforeunload", flushPendingPlaybackAutosave);
		};
	}, [flushSong, flushSlide]);
}
