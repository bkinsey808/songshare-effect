import { describe, expect, it } from "vitest";

import computeInitialMaxNotes from "@/react/music/sci/computeInitialMaxNotes";

const DEFAULT_MAX_NOTES = 4;

describe("computeInitialMaxNotes", () => {
	it("returns the selected shape note count from the initial token", () => {
		// Arrange
		const initialChordToken = "[C M7]";

		// Act
		const result = computeInitialMaxNotes({ initialChordToken });

		// Assert
		expect(result).toBe(DEFAULT_MAX_NOTES);
	});

	it("falls back to the default max notes when the token is missing", () => {
		// Arrange
		const initialChordToken = undefined;

		// Act
		const result = computeInitialMaxNotes({ initialChordToken });

		// Assert
		expect(result).toBe(DEFAULT_MAX_NOTES);
	});
});
