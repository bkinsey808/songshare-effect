import { describe, expect, test } from "vitest";

import useAudioVizInput from "./useAudioVizInput";

describe("useAudioVizInput (export)", () => {
	test("exports a function", () => {
		expect(typeof useAudioVizInput).toBe("function");
	});
});
