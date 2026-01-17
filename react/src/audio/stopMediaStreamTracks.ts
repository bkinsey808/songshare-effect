import type { MinimalMediaStream } from "./types";

/**
 * Stop all tracks associated with a `MediaStream`.
 *
 * This helper iterates `stream.getTracks()` and calls `.stop()` on each track.
 *
 * @param stream - The `MediaStream` whose tracks should be stopped.
 */
export default function stopMediaStreamTracks(stream: MinimalMediaStream): void {
	for (const track of stream.getTracks()) {
		track.stop();
	}
}
