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
export default function getMicStreamForDevice(deviceId: string | undefined): Promise<MediaStream> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.getUserMedia !== "function") {
		throw new TypeError("This browser does not support getUserMedia() (microphone capture)");
	}
	if (deviceId === undefined || deviceId === "default") {
		return mediaDevices.getUserMedia({ audio: true });
	}
	return mediaDevices.getUserMedia({
		audio: {
			deviceId: { exact: deviceId },
		},
	});
}
