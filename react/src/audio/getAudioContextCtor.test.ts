import { afterEach, describe, expect, it, vi } from "vitest";

import getAudioContextCtor from "./getAudioContextCtor";

describe("getAudioContextCtor", () => {
	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns the AudioContext constructor when it is defined", () => {
		const MockAudioContext = vi.fn();
		vi.stubGlobal("AudioContext", MockAudioContext);

		const result = getAudioContextCtor();

		expect(result).toBe(MockAudioContext);
	});

	it("returns undefined when AudioContext is not defined", () => {
		vi.stubGlobal("AudioContext", undefined);

		const result = getAudioContextCtor();

		expect(result).toBeUndefined();
	});
});
