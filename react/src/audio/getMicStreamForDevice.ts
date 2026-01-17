import type { MinimalMediaStream } from "./types";

/**
 * Request a microphone `MediaStream` for a specific device id.
 *
 * If `deviceId` is `undefined` or the string "default" the browser's default
 * microphone stream is requested. Otherwise a `deviceId.exact` constraint is used.
 *
 * @param deviceId - The device id to request, or `undefined`/"default" for the default device.
 * @throws {TypeError} If the browser does not support `getUserMedia()`.
 * @returns A promise resolving to the requested `MediaStream`.
 */
export default function getMicStreamForDevice(
	deviceId: string | undefined,
): Promise<MinimalMediaStream> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.getUserMedia !== "function") {
		throw new TypeError("This browser does not support getUserMedia() (microphone capture)");
	}
	const commonConstraints = {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false,
	};

	if (deviceId === undefined || deviceId === "default") {
		return mediaDevices.getUserMedia({
			audio: {
				...commonConstraints,
			},
		});
	}
	return mediaDevices.getUserMedia({
		audio: {
			...commonConstraints,
			deviceId: { exact: deviceId },
		},
	});
}
