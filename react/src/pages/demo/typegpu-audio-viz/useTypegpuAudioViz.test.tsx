import { describe, expect, test } from "vitest";

import useTypegpuAudioViz from "./useTypegpuAudioViz";

describe("useTypegpuAudioViz (export)", () => {
	test("exports a function", () => {
		expect(typeof useTypegpuAudioViz).toBe("function");
	});
});
