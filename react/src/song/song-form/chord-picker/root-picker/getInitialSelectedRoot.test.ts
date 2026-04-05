import { describe, expect, it } from "vitest";

import getInitialSelectedRoot from "./getInitialSelectedRoot";

describe("getInitialSelectedRoot", () => {
	it("returns the parsed absolute root in letters mode", () => {
		// Arrange
		const params = {
			chordDisplayMode: "letters" as const,
			initialChordToken: "[Bb -]",
			songKey: "C" as const,
		};

		// Act
		const result = getInitialSelectedRoot(params);

		// Assert
		expect(result).toStrictEqual({
			root: "Bb",
			rootType: "absolute",
			label: "Bb",
		});
	});

	it("returns the parsed roman root in roman mode", () => {
		// Arrange
		const params = {
			chordDisplayMode: "roman" as const,
			initialChordToken: "[bIII ROng]",
			songKey: "C" as const,
		};

		// Act
		const result = getInitialSelectedRoot(params);

		// Assert
		expect(result).toStrictEqual({
			root: "bIII",
			rootType: "roman",
			label: "bIII",
		});
	});

	it("defaults to I in roman mode when there is no initial token", () => {
		// Arrange
		const params = {
			chordDisplayMode: "roman" as const,
			initialChordToken: undefined,
			songKey: "G" as const,
		};

		// Act
		const result = getInitialSelectedRoot(params);

		// Assert
		expect(result).toStrictEqual({
			root: "I",
			rootType: "roman",
			label: "I",
		});
	});
});
