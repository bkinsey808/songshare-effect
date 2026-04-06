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

describe("computeDisplayedShapes", () => {
	it("pins the selected shape M first when it appears in the empty-query results", () => {
		// Arrange
		const params = {
			query: EMPTY_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: MAJOR_SHAPE_CODE,
		} as const;

		// Act
		const { displayedShapes, selectedShape } = computeDisplayedShapes(params);

		// Assert
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(MAJOR_SHAPE_CODE);
		expect(selectedShape?.code).toStrictEqual(MAJOR_SHAPE_CODE);
	});

	it("pins the selected shape M7 first when it appears in the M7-query results", () => {
		// Arrange
		const params = {
			query: M7_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: MAJOR_SEVEN_SHAPE_CODE,
		} as const;

		// Act
		const { displayedShapes, selectedShape } = computeDisplayedShapes(params);

		// Assert
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(MAJOR_SEVEN_SHAPE_CODE);
		expect(selectedShape?.code).toStrictEqual(MAJOR_SEVEN_SHAPE_CODE);
	});

	it("does not pin M when M is absent from the sus4 search results", () => {
		// Arrange
		const params = {
			query: SUS4_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: MAJOR_SHAPE_CODE,
		} as const;
		const sus4Shapes = searchChordShapes({ query: SUS4_QUERY, maxNotes: MAX_NOTES });

		// Act
		const { displayedShapes, selectedShape } = computeDisplayedShapes(params);

		// Assert – displayed order matches the raw search results (M is not pinned to first)
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(sus4Shapes[FIRST_INDEX]?.code);
		// selectedShape is still resolved to M via getChordShapeByCode
		expect(selectedShape).toStrictEqual(getChordShapeByCode(MAJOR_SHAPE_CODE));
	});

	it("falls back to the first search result when selectedShapeCode is not a valid chord code", () => {
		// Arrange
		const UNKNOWN_CODE = "completely_unknown_xyz";
		const params = {
			query: EMPTY_QUERY,
			maxNotes: MAX_NOTES,
			selectedShapeCode: UNKNOWN_CODE,
		} as const;
		const allShapes = searchChordShapes({ query: EMPTY_QUERY, maxNotes: MAX_NOTES });

		// Act – getChordShapeByCode returns undefined so fallback is displayedShapes[0]
		const { displayedShapes, selectedShape } = computeDisplayedShapes(params);

		// Assert
		expect(displayedShapes[FIRST_INDEX]?.code).toStrictEqual(allShapes[FIRST_INDEX]?.code);
		expect(selectedShape).toStrictEqual(allShapes[FIRST_INDEX]);
	});
});
