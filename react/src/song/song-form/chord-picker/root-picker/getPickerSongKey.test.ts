import { describe, expect, it } from "vitest";

import getPickerSongKey from "./getPickerSongKey";

describe("getPickerSongKey", () => {
	it("returns the provided song key when it is valid", () => {
		// Arrange
		const songKey = "G";

		// Act
		const result = getPickerSongKey(songKey);

		// Assert
		expect(result).toBe("G");
	});

	it("falls back to C when the song key is empty", () => {
		// Arrange
		const songKey = "";

		// Act
		const result = getPickerSongKey(songKey);

		// Assert
		expect(result).toBe("C");
	});
});
