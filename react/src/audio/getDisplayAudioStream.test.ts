import { afterEach, describe, expect, it, vi } from "vitest";

import getDisplayAudioStream from "./getDisplayAudioStream";

describe("getDisplayAudioStream", () => {
	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("throws TypeError if mediaDevices is not supported", () => {
		vi.stubGlobal("navigator", { mediaDevices: undefined });

		expect(() => getDisplayAudioStream()).toThrow("This browser does not support mediaDevices");
	});

	it("throws TypeError if getDisplayMedia is not supported", () => {
		vi.stubGlobal("navigator", { mediaDevices: {} });

		expect(() => getDisplayAudioStream()).toThrow(
			"This browser does not support getDisplayMedia() (tab/screen audio capture)",
		);
	});

	it("requests display capture with audio and video constraints", async () => {
		const mockGetDisplayMedia = vi.fn().mockResolvedValue({ id: "display-stream" });
		vi.stubGlobal("navigator", { mediaDevices: { getDisplayMedia: mockGetDisplayMedia } });

		const stream = await getDisplayAudioStream();

		expect(mockGetDisplayMedia).toHaveBeenCalledWith({
			audio: true,
			video: true,
		});
		expect(stream).toEqual({ id: "display-stream" });
	});
});
