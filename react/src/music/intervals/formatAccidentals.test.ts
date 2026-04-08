import { describe, expect, it } from "vitest";

import formatAccidentals from "@/react/music/intervals/formatAccidentals";

describe("formatAccidentals", () => {
	it("formats note-name accidentals with Unicode symbols", () => {
		// Arrange
		const value = "Bb C# Eb";

		// Act
		const result = formatAccidentals(value);

		// Assert
		expect(result).toBe("B♭ C♯ E♭");
	});

	it("formats interval accidentals with Unicode symbols", () => {
		// Arrange
		const value = "b3,#5";

		// Act
		const result = formatAccidentals(value);

		// Assert
		expect(result).toBe("♭3,♯5");
	});

	it("formats accidentals after separators used in shape descriptions", () => {
		// Arrange
		const value = "Major chord (b3) / #5";

		// Act
		const result = formatAccidentals(value);

		// Assert
		expect(result).toBe("Major chord (♭3) / ♯5");
	});

	it("leaves text without accidentals unchanged", () => {
		// Arrange
		const value = "Major Chord";

		// Act
		const result = formatAccidentals(value);

		// Assert
		expect(result).toBe("Major Chord");
	});
});
