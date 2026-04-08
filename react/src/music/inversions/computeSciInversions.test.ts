import { describe, expect, it } from "vitest";

import computeSciInversions from "./computeSciInversions";

const C_MAJOR_ROOT = "C" as const;
const MAJOR_SHAPE_CODE = "M";
const UNKNOWN_SHAPE_CODE = "unknown_xyz";
const ZERO_INVERSIONS = 0;
const EXPECTED_INVERSION_COUNT = 2;
const FIRST_INVERSION_INDEX = 0;
const SECOND_INVERSION_INDEX = 1;
const FIRST_INVERSION_NUMBER = 1;
const SECOND_INVERSION_NUMBER = 2;
const EXPECTED_FIRST_BASS = "E";
const EXPECTED_SECOND_BASS = "G";

describe("computeSciInversions", () => {
	it("returns an empty array for an unknown shape code", () => {
		// Act
		const result = computeSciInversions(C_MAJOR_ROOT, UNKNOWN_SHAPE_CODE);

		// Assert
		expect(result).toHaveLength(ZERO_INVERSIONS);
	});

	it("returns the correct inversion count, numbers, and bass notes for C major", () => {
		// Act
		const result = computeSciInversions(C_MAJOR_ROOT, MAJOR_SHAPE_CODE);

		// Assert
		expect(result).toHaveLength(EXPECTED_INVERSION_COUNT);
		expect(result[FIRST_INVERSION_INDEX]?.inversionNumber).toStrictEqual(FIRST_INVERSION_NUMBER);
		expect(result[FIRST_INVERSION_INDEX]?.bassRoot).toBe(EXPECTED_FIRST_BASS);
		expect(result[SECOND_INVERSION_INDEX]?.inversionNumber).toStrictEqual(SECOND_INVERSION_NUMBER);
		expect(result[SECOND_INVERSION_INDEX]?.bassRoot).toBe(EXPECTED_SECOND_BASS);
	});

	it("sets originalRoot to the provided absolute root for all inversions", () => {
		// Act
		const result = computeSciInversions(C_MAJOR_ROOT, MAJOR_SHAPE_CODE);

		// Assert
		expect(result[FIRST_INVERSION_INDEX]?.originalRoot).toBe(C_MAJOR_ROOT);
		expect(result[SECOND_INVERSION_INDEX]?.originalRoot).toBe(C_MAJOR_ROOT);
	});

	it("sets matchedShape when the re-rooted spelling matches a known chord (augmented chord)", () => {
		// Arrange – augmented chord (+) is symmetric: every inversion re-roots to another augmented chord
		const AUG_SHAPE_CODE = "+";

		// Act
		const result = computeSciInversions(C_MAJOR_ROOT, AUG_SHAPE_CODE);

		// Assert
		expect(result[FIRST_INVERSION_INDEX]?.matchedShape).toBeDefined();
		expect(result[FIRST_INVERSION_INDEX]?.matchedShape?.spelling).toBe("3,b6");
	});
});
