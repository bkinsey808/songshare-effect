import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";

import computeShapeAfterNoteToggle from "./computeShapeAfterNoteToggle";

const ROOT_SEMITONE_OFFSET = 0;
const MAJOR_THIRD_OFFSET = 4;
const TRITONE_OFFSET = 6;
const DOMINANT_SEVENTH_OFFSET = 10;
const OUT_OF_RANGE_OFFSET = 12;

const MAJOR_SHAPE_CODE = "M";
const POWER_CHORD_SPELLING = "5";
const DOM7_SPELLING = "3,5,b7";
const MAJOR_THIRD_SPELLING = "3";
// "3,b5,5" has no catalog entry — adding b5 to major "3,5" triggers the synthetic-shape path
const SYNTHETIC_SPELLING = "3,b5,5";

describe("computeShapeAfterNoteToggle", () => {
	it.each([
		{
			name: "root semitone offset is toggled",
			selectedShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			semitoneOffset: ROOT_SEMITONE_OFFSET,
		},
		{
			name: "semitone offset is out of the label range",
			selectedShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			semitoneOffset: OUT_OF_RANGE_OFFSET,
		},
	])("returns undefined when $name", ({ selectedShape, semitoneOffset }) => {
		// Act
		const result = computeShapeAfterNoteToggle({ selectedShape, semitoneOffset });

		// Assert
		expect(result).toBeUndefined();
	});

	it.each([
		{
			name: "major third removed from major chord leaves a power chord",
			selectedShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			semitoneOffset: MAJOR_THIRD_OFFSET,
			expectedSpelling: POWER_CHORD_SPELLING,
		},
		{
			name: "b7 added to major chord produces dominant seventh",
			selectedShape: getChordShapeByCode(MAJOR_SHAPE_CODE),
			semitoneOffset: DOMINANT_SEVENTH_OFFSET,
			expectedSpelling: DOM7_SPELLING,
		},
		{
			name: "major third added to empty-spelling shape",
			selectedShape: forceCast<ChordShape>({ spelling: "" }),
			semitoneOffset: MAJOR_THIRD_OFFSET,
			expectedSpelling: MAJOR_THIRD_SPELLING,
		},
		{
			name: "major third toggled with undefined shape treated as empty",
			selectedShape: undefined,
			semitoneOffset: MAJOR_THIRD_OFFSET,
			expectedSpelling: MAJOR_THIRD_SPELLING,
		},
	])("returns catalog shape: $name", ({ selectedShape, semitoneOffset, expectedSpelling }) => {
		// Act
		const result = computeShapeAfterNoteToggle({ selectedShape, semitoneOffset });

		// Assert
		expect(result?.spelling).toStrictEqual(expectedSpelling);
	});

	it("returns a synthetic shape when no catalog entry matches the resulting spelling", () => {
		// Arrange — adding b5 (tritone) to major "3,5" produces "3,b5,5" which has no catalog entry
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = computeShapeAfterNoteToggle({ selectedShape, semitoneOffset: TRITONE_OFFSET });

		// Assert
		expect(result?.spelling).toBe(SYNTHETIC_SPELLING);
		expect(result?.code).toBe(SYNTHETIC_SPELLING);
		expect(result?.prefer).toBe(false);
	});
});
