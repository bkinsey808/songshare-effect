import { describe, expect, it } from "vitest";

import findChordTokens from "./findChordTokens";

const DUPLICATE_CHORD_TEXT = "Hello [C -] world [G 7] again [C -]";
const INVALID_CHORD_TEXT = "Hello [not a chord] world";

describe("findChordTokens", () => {
	it("returns distinct valid chord tokens in first-appearance order", () => {
		// Arrange
		const value = DUPLICATE_CHORD_TEXT;

		// Act
		const result = findChordTokens(value);

		// Assert
		expect(result).toStrictEqual(["[C -]", "[G 7]"]);
	});

	it("ignores bracketed text that is not a valid chord token", () => {
		// Arrange
		const value = INVALID_CHORD_TEXT;

		// Act
		const result = findChordTokens(value);

		// Assert
		expect(result).toStrictEqual([]);
	});
});
