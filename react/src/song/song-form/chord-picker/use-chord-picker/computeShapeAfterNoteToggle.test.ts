import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";

import computeShapeAfterNoteToggle from "./computeShapeAfterNoteToggle";

const ROOT_SEMITONE_OFFSET = 0;
const MAJOR_THIRD_SEMITONE_OFFSET = 4;
const DOMINANT_SEVENTH_SEMITONE_OFFSET = 10;
const OUT_OF_RANGE_SEMITONE_OFFSET = 12;
const MAJOR_SHAPE_CODE = "M";
const DOM7_SPELLING = "3,5,b7";
const POWER_CHORD_SPELLING = "5";
const MAJOR_THIRD_INTERVAL_SPELLING = "3";

describe("computeShapeAfterNoteToggle", () => {
	it("returns undefined when the root semitone offset is toggled", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = computeShapeAfterNoteToggle({
			selectedShape,
			semitoneOffset: ROOT_SEMITONE_OFFSET,
		});

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined when semitoneOffset is out of the SEMITONE_INTERVAL_LABELS range", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act – SEMITONE_INTERVAL_LABELS only has indices 0–11; 12 has no label
		const result = computeShapeAfterNoteToggle({
			selectedShape,
			semitoneOffset: OUT_OF_RANGE_SEMITONE_OFFSET,
		});

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns the power-chord shape when the major third is removed from a major chord", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE); // spelling: "3,5"

		// Act – "3" IS in the set so it is deleted, leaving spelling "5"
		const result = computeShapeAfterNoteToggle({
			selectedShape,
			semitoneOffset: MAJOR_THIRD_SEMITONE_OFFSET,
		});

		// Assert
		expect(result).toBeDefined();
		expect(result?.spelling).toStrictEqual(POWER_CHORD_SPELLING);
	});

	it("returns the dominant-seventh shape when b7 is added to a major chord", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE); // spelling: "3,5"

		// Act – "b7" is NOT in the set so it is added, producing "3,5,b7"
		const result = computeShapeAfterNoteToggle({
			selectedShape,
			semitoneOffset: DOMINANT_SEVENTH_SEMITONE_OFFSET,
		});

		// Assert
		expect(result).toBeDefined();
		expect(result?.spelling).toStrictEqual(DOM7_SPELLING);
	});

	it("returns a shape from an empty-spelling shape after toggling a non-root interval", () => {
		// Arrange – simulate a single-note chord with no spelling
		const selectedShape = forceCast<ChordShape>({ spelling: "" });

		// Act – empty spelling treated as no intervals; "3" is added; "3" alone is a known shape
		const result = computeShapeAfterNoteToggle({
			selectedShape,
			semitoneOffset: MAJOR_THIRD_SEMITONE_OFFSET,
		});

		// Assert
		expect(result?.spelling).toStrictEqual(MAJOR_THIRD_INTERVAL_SPELLING);
	});

	it("returns a shape when selectedShape is undefined and a non-root interval is toggled", () => {
		// Act – undefined shape treated as empty intervals; "3" is added
		const result = computeShapeAfterNoteToggle({
			selectedShape: undefined,
			semitoneOffset: MAJOR_THIRD_SEMITONE_OFFSET,
		});

		// Assert
		expect(result?.spelling).toStrictEqual(MAJOR_THIRD_INTERVAL_SPELLING);
	});
});

