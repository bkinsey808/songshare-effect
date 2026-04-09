import { describe, expect, it } from "vitest";

import computeAllShapeInversions from "@/react/music/inversions/computeAllShapeInversions";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import {
	DEFAULT_MAX_CHORD_NOTES,
	DEFAULT_MIN_CHORD_NOTES,
	getChordShapeByCode,
	type ChordShape,
} from "@/shared/music/chord-shapes";

// it.each is not used here because each case validates structurally different properties
// (empty check vs. length check vs. Map membership), which would require assertion callbacks
// rather than a plain expected value — making it.each less readable than individual it blocks.

const EMPTY_COUNT = 0;

const EMPTY_NOTE_SEARCH = new Map<number, NoteSearchToggleState>();

function requireShape(code: string): ChordShape {
	const shape = getChordShapeByCode(code);
	if (shape === undefined) {
		throw new Error(`Shape "${code}" not found in SCI list`);
	}
	return shape;
}

// I6 (Italian Six) is a known shape in the SCI list.
const ITALIAN_SIX_SHAPE = requireShape("I6");

const BASE_PARAMS = {
	query: "",
	minNotes: DEFAULT_MIN_CHORD_NOTES,
	maxNotes: DEFAULT_MAX_CHORD_NOTES,
	noteSearchState: EMPTY_NOTE_SEARCH,
	displayedShapes: [],
	songKey: "C" as const,
	chordDisplayMode: "letters" as const,
} as const;

describe("computeAllShapeInversions", () => {
	it("returns empty inversions and ordinals when deferredIncludeInversions is false", () => {
		// Arrange
		const params = { ...BASE_PARAMS, deferredIncludeInversions: false };

		// Act
		const { inversions, directShapeOrdinals } = computeAllShapeInversions(params);

		// Assert
		expect(inversions).toHaveLength(EMPTY_COUNT);
		expect(directShapeOrdinals.size).toBe(EMPTY_COUNT);
	});

	it("returns inversions with the correct sourceShapeCode for each originating shape", () => {
		// Arrange
		const params = { ...BASE_PARAMS, deferredIncludeInversions: true };

		// Act
		const { inversions } = computeAllShapeInversions(params);
		const majorInversions = inversions.filter((inv) => inv.sourceShapeCode === "M");

		// Assert
		expect(majorInversions.length).toBeGreaterThan(EMPTY_COUNT);
		for (const inv of majorInversions) {
			expect(inv.sourceShapeName).toBeTruthy();
			expect(inv.displayToken).toBeTruthy();
			expect(inv.inversion).toBeDefined();
		}
	});

	it("tracks a matched inversion in directShapeOrdinals and excludes it from inversions", () => {
		// Arrange
		// C minor (code "-") has a 1st inversion with bassRoot "Eb" and re-rooted spelling "3,6",
		// which matches the Italian Six chord (code "I6"). When I6 is in displayedShapes,
		// that inversion should be omitted from inversions and tracked in directShapeOrdinals instead.
		const params = {
			...BASE_PARAMS,
			deferredIncludeInversions: true,
			displayedShapes: [ITALIAN_SIX_SHAPE],
		};

		// Act
		const { inversions, directShapeOrdinals } = computeAllShapeInversions(params);

		// Assert
		expect(directShapeOrdinals.has("I6")).toBe(true);
		expect(inversions.some((inv) => inv.inversion.matchedShape?.code === "I6")).toBe(false);
	});
});
