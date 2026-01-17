import { afterEach, describe, expect, it, vi } from "vitest";

import enumerateAudioInputDevices from "./enumerateAudioInputDevices";

describe("enumerateAudioInputDevices", () => {
	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns empty array if mediaDevices is not supported", async () => {
		vi.stubGlobal("navigator", { mediaDevices: undefined });

		const result = await enumerateAudioInputDevices();

		expect(result).toEqual([]);
	});

	it("returns empty array if enumerateDevices is not supported", async () => {
		vi.stubGlobal("navigator", { mediaDevices: {} });

		const result = await enumerateAudioInputDevices();

		expect(result).toEqual([]);
	});

	it("returns only audioinput devices", async () => {
		const mockDevices = [
			{ kind: "audioinput", label: "Mic 1", deviceId: "mic1" },
			{ kind: "videoinput", label: "Cam 1", deviceId: "cam1" },
			{ kind: "audiooutput", label: "Speaker 1", deviceId: "speaker1" },
			{ kind: "audioinput", label: "Mic 2", deviceId: "mic2" },
		];

		const mockEnumerateDevices = vi.fn().mockResolvedValue(mockDevices);
		vi.stubGlobal("navigator", { mediaDevices: { enumerateDevices: mockEnumerateDevices } });

		const result = await enumerateAudioInputDevices();

		expect(result).toEqual([
			{ kind: "audioinput", label: "Mic 1", deviceId: "mic1" },
			{ kind: "audioinput", label: "Mic 2", deviceId: "mic2" },
		]);
	});

	it("returns empty array if no devices found", async () => {
		const mockEnumerateDevices = vi.fn().mockResolvedValue([]);
		vi.stubGlobal("navigator", { mediaDevices: { enumerateDevices: mockEnumerateDevices } });

		const result = await enumerateAudioInputDevices();

		expect(result).toEqual([]);
	});
});
