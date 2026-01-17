import { afterEach, describe, expect, it, vi } from "vitest";

import getMicStreamForDevice from "./getMicStreamForDevice";

describe("getMicStreamForDevice", () => {
	const commonConstraints = {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false,
	};

	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("throws TypeError if mediaDevices is not supported", () => {
		vi.stubGlobal("navigator", { mediaDevices: undefined });

		expect(() => getMicStreamForDevice(undefined)).toThrow(
			"This browser does not support getUserMedia() (microphone capture)",
		);
	});

	it("requests default microphone when deviceId is undefined", async () => {
		const mockGetUserMedia = vi.fn().mockResolvedValue({ id: "default-stream" });
		vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: mockGetUserMedia } });

		const stream = await getMicStreamForDevice(undefined);

		expect(mockGetUserMedia).toHaveBeenCalledWith({
			audio: {
				...commonConstraints,
			},
		});
		expect(stream).toEqual({ id: "default-stream" });
	});

	it("requests default microphone when deviceId is 'default'", async () => {
		const mockGetUserMedia = vi.fn().mockResolvedValue({ id: "default-stream" });
		vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: mockGetUserMedia } });

		const stream = await getMicStreamForDevice("default");

		expect(mockGetUserMedia).toHaveBeenCalledWith({
			audio: {
				...commonConstraints,
			},
		});
		expect(stream).toEqual({ id: "default-stream" });
	});

	it("requests specific microphone when deviceId is provided", async () => {
		const mockGetUserMedia = vi.fn().mockResolvedValue({ id: "specific-stream" });
		const deviceId = "some-device-id";
		vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: mockGetUserMedia } });

		const stream = await getMicStreamForDevice(deviceId);

		expect(mockGetUserMedia).toHaveBeenCalledWith({
			audio: {
				...commonConstraints,
				deviceId: { exact: deviceId },
			},
		});
		expect(stream).toEqual({ id: "specific-stream" });
	});
});
