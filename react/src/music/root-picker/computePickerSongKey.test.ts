import { describe, expect, it } from "vitest";

import computePickerSongKey from "@/react/music/root-picker/computePickerSongKey";

describe("computePickerSongKey", () => {
	it.each([
		["returns the provided song key when it is valid", "G", "G"],
		["falls back to C when the song key is empty", "", "C"],
	] as const)("%s", (_name, songKey, expected) => {
		expect(computePickerSongKey(songKey)).toBe(expected);
	});
});
