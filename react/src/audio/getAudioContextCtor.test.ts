import { describe, expect, it, vi } from "vitest";

import getAudioContextCtor from "./getAudioContextCtor";

describe("getAudioContextCtor", () => {
	it("returns the AudioContext constructor when it is defined", () => {
		const MockAudioContext = vi.fn();
		vi.stubGlobal("AudioContext", MockAudioContext);

		const result = getAudioContextCtor();

		expect(result).toBe(MockAudioContext);
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns undefined when AudioContext is not defined", () => {
		vi.stubGlobal("AudioContext", undefined);

		const result = getAudioContextCtor();

		expect(result).toBeUndefined();
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});
});
