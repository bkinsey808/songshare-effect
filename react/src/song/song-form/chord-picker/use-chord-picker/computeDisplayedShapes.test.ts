import { describe, expect, it } from "vitest";

import { getChordShapeByCode, searchChordShapes } from "@/shared/music/chord-shapes";

import computeDisplayedShapes from "./computeDisplayedShapes";

const MAJOR_SHAPE_CODE = "M";
const MAJOR_SEVEN_SHAPE_CODE = "M7";
const EMPTY_QUERY = "";
const M7_QUERY = "M7";
const SUS4_QUERY = "sus4";
const MAX_NOTES = 4;
const FIRST_INDEX = 0;
const UNKNOWN_CODE = "completely_unknown_xyz";
// Comma-containing code: not a catalog code, triggers the synthetic-shape path
const SYNTHETIC_SHAPE_CODE = "b3,5";
// "b3,5".split(",").length + 1 (root)
const SYNTHETIC_NOTE_COUNT = 3;

describe("computeDisplayedShapes", () => {
	it.each([
		{
			name: "selected shape M is pinned first on empty query",
			query: EMPTY_QUERY,
			selectedShapeCode: MAJOR_SHAPE_CODE,
		},
		{
			name: "selected shape M7 is pinned first on M7 query",
			query: M7_QUERY,
			selectedShapeCode: MAJOR_SEVEN_SHAPE_CODE,
		},
	])("$name", ({ query, selectedShapeCode }) => {
		// Act
		const { displayedShapes, selectedShape } = computeDisplayedShapes({
			query,
			maxNotes: MAX_NOTES,
			selectedShapeCode,
		});

		// Assert
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(selectedShapeCode);
		expect(selectedShape?.code).toStrictEqual(selectedShapeCode);
	});

	it("does not pin selected shape when it is absent from search results", () => {
		// Arrange
		const sus4Shapes = searchChordShapes({ query: SUS4_QUERY, maxNotes: MAX_NOTES });

		// Act — M is selected but not in the sus4 results
		const { displayedShapes, selectedShape } = computeDisplayedShapes({
			query: SUS4_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: MAJOR_SHAPE_CODE,
		});

		// Assert — raw order preserved; selectedShape still resolves to M via getChordShapeByCode
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(sus4Shapes[FIRST_INDEX]?.code);
		expect(selectedShape).toStrictEqual(getChordShapeByCode(MAJOR_SHAPE_CODE));
	});

	it("falls back to first search result when shape code is unknown", () => {
		// Arrange
		const allShapes = searchChordShapes({ query: EMPTY_QUERY, maxNotes: MAX_NOTES });

		// Act — getChordShapeByCode returns undefined; no comma in code; falls back to displayedShapes[0]
		const { displayedShapes, selectedShape } = computeDisplayedShapes({
			query: EMPTY_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: UNKNOWN_CODE,
		});

		// Assert
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(allShapes[FIRST_INDEX]?.code);
		expect(selectedShape).toStrictEqual(allShapes[FIRST_INDEX]);
	});

	it("resolves a synthetic shape when the shape code contains a comma", () => {
		// Act — comma-containing code is not found by getChordShapeByCode, triggering the
		// synthetic-shape construction branch
		const { selectedShape } = computeDisplayedShapes({
			query: EMPTY_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: SYNTHETIC_SHAPE_CODE,
		});

		// Assert
		expect(selectedShape?.code).toBe(SYNTHETIC_SHAPE_CODE);
		expect(selectedShape?.spelling).toBe(SYNTHETIC_SHAPE_CODE);
		expect(selectedShape?.prefer).toBe(false);
		expect(selectedShape?.noteCount).toBe(SYNTHETIC_NOTE_COUNT);
	});
});
