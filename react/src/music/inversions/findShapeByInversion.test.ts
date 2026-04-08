import { describe, expect, it } from "vitest";

import findShapeByInversion from "./findShapeByInversion";

const MINOR_THIRD_OFFSET = 3;
const MAJOR_THIRD_OFFSET = 4;

// Input spellings
const EMPTY_SPELLING = "";
const UNKNOWN_INTERVAL_SPELLING = "x9";
const MAJOR_SPELLING = "3,5";
const AUGMENTED_SPELLING = "3,b6";
const MINOR_SPELLING = "b3,5";
const DIMINISHED_SPELLING = "b3,b5";
const MINOR_SEVENTH_SPELLING = "b3,5,b7";

// Expected re-rooted shape spellings
const AUGMENTED_SHAPE_SPELLING = "3,b6";
const SIXTH_CHORD_SHAPE_SPELLING = "3,6";
const PERU3_SHAPE_SPELLING = "b3,6";
const MAJOR_SIXTH_SHAPE_SPELLING = "3,5,6";

describe("findShapeByInversion", () => {
	it.each([
		{
			name: "empty spelling",
			spelling: EMPTY_SPELLING,
		},
		{
			name: "unrecognized interval label",
			spelling: UNKNOWN_INTERVAL_SPELLING,
		},
		{
			name: "major chord whose re-rootings do not match any catalog shape",
			spelling: MAJOR_SPELLING,
		},
	])("returns undefined for $name", ({ spelling }) => {
		// Act
		const result = findShapeByInversion(spelling);

		// Assert
		expect(result).toBeUndefined();
	});

	it.each([
		{
			name: "augmented chord (symmetric — re-roots to another augmented chord)",
			spelling: AUGMENTED_SPELLING,
			expectedShapeSpelling: AUGMENTED_SHAPE_SPELLING,
			expectedInversionRootOffset: MAJOR_THIRD_OFFSET,
		},
		{
			name: "minor chord (first inversion re-roots to a sixth chord)",
			spelling: MINOR_SPELLING,
			expectedShapeSpelling: SIXTH_CHORD_SHAPE_SPELLING,
			expectedInversionRootOffset: MINOR_THIRD_OFFSET,
		},
		{
			name: "diminished chord (first inversion re-roots to Peru3)",
			spelling: DIMINISHED_SPELLING,
			expectedShapeSpelling: PERU3_SHAPE_SPELLING,
			expectedInversionRootOffset: MINOR_THIRD_OFFSET,
		},
		{
			name: "minor seventh chord (first inversion re-roots to a major sixth chord)",
			spelling: MINOR_SEVENTH_SPELLING,
			expectedShapeSpelling: MAJOR_SIXTH_SHAPE_SPELLING,
			expectedInversionRootOffset: MINOR_THIRD_OFFSET,
		},
	])(
		"returns first catalog match for $name",
		({ spelling, expectedShapeSpelling, expectedInversionRootOffset }) => {
			// Act
			const result = findShapeByInversion(spelling);

			// Assert
			expect(result).toBeDefined();
			expect(result?.shape.spelling).toBe(expectedShapeSpelling);
			expect(result?.inversionRootOffset).toBe(expectedInversionRootOffset);
		},
	);
});
