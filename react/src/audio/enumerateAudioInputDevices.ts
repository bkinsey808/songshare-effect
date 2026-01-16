/**
 * Enumerate available audio input devices (microphones).
 *
 * This returns an array of `MediaDeviceInfo` entries filtered to
 * only include `audioinput` devices. If the browser does not support
 * device enumeration it returns an empty array.
 *
 * @returns A promise resolving to an array of audio input devices.
 */
export default async function enumerateAudioInputDevices(): Promise<MediaDeviceInfo[]> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.enumerateDevices !== "function") {
		return [];
	}
	const devices = await mediaDevices.enumerateDevices();
	return devices.filter((device) => device.kind === "audioinput");
}
