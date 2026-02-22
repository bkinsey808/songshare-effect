import { describe, expect, it, vi } from "vitest";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import { spyUseAudioCapture, spyUseSmoothedAudioLevelRef, type AsyncSpy } from "./spyAudio";

// we don't care about the full SpyLike interface here; the helpers only
// call a few methods so our fake can be minimal.
const fakeSpy: AsyncSpy = {
	mockReturnValue: vi.fn().mockReturnThis(),
	mockReturnValueOnce: vi.fn().mockReturnThis(),
	mockResolvedValue: vi.fn().mockReturnThis(),
	mockResolvedValueOnce: vi.fn().mockReturnThis(),
};

vi.mock("@/react/lib/test-utils/spy-import/spyImport");

describe("spyAudio helpers", () => {
	function setup(): void {
		vi.resetAllMocks();
		// always resolve to our fake spy so callers can invoke methods if
		// needed; tests below only assert the value is forwarded correctly.
		vi.mocked(spyImport).mockResolvedValue(fakeSpy);
	}

	it("spyUseAudioCapture forwards to spyImport with the proper path", async () => {
		setup();
		const result = await spyUseAudioCapture();

		expect(spyImport).toHaveBeenCalledWith("@/react/lib/audio/useAudioCapture");
		expect(result).toBe(fakeSpy);
	});

	it("spyUseSmoothedAudioLevelRef forwards to spyImport with the proper path", async () => {
		setup();
		const result = await spyUseSmoothedAudioLevelRef();

		expect(spyImport).toHaveBeenCalledWith("@/react/lib/audio/smooth/useSmoothedAudioLevelRef");
		expect(result).toBe(fakeSpy);
	});
});
