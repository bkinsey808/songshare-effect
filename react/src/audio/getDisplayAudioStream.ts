import type { MinimalMediaStream } from "./types";

/**
 * Request a display (tab/screen) capture stream that includes audio.
 *
 * Many browsers require `{ video: true }` to allow display capture; this helper
 * requests `audio: true` and `video: true` and returns the resulting stream.
 *
 * @throws {TypeError} If the browser does not support `mediaDevices` or `getDisplayMedia()`.
 * @returns A promise resolving to the captured `MediaStream`.
 */
export default function getDisplayAudioStream(): Promise<MinimalMediaStream> {
	const { mediaDevices } = navigator;
	if (mediaDevices === undefined) {
		throw new TypeError("This browser does not support mediaDevices");
	}
	if (typeof mediaDevices.getDisplayMedia !== "function") {
		throw new TypeError(
			"This browser does not support getDisplayMedia() (tab/screen audio capture)",
		);
	}
	// Many browsers require video: true for display capture; we ignore the video.
	return mediaDevices.getDisplayMedia({ audio: true, video: true });
}
