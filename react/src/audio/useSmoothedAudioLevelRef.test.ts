import { describe, expect, test } from "vitest";

import useSmoothedAudioLevelRef from "./useSmoothedAudioLevelRef";

describe("useSmoothedAudioLevelRef (export)", () => {
	test("exports a function", () => {
		expect(typeof useSmoothedAudioLevelRef).toBe("function");
	});
});
