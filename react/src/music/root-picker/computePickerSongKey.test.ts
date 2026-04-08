import { describe, expect, it } from "vitest";

import computePickerSongKey from "@/react/music/root-picker/computePickerSongKey";

describe("computePickerSongKey", () => {
	it("returns the provided song key when it is valid", () => {
		// Arrange
		const songKey = "G";

		// Act
		const result = computePickerSongKey(songKey);

		// Assert
		expect(result).toBe("G");
	});

	it("falls back to C when the song key is empty", () => {
		// Arrange
		const songKey = "";

		// Act
		const result = computePickerSongKey(songKey);

		// Assert
		expect(result).toBe("C");
	});
});
