import { describe, expect, it } from "vitest";

import { getChordShapeByCode } from "@/shared/music/chord-shapes";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import computeInversionPreviewTokens from "@/react/music/inversions/computeInversionPreviewTokens";
import computeSciInversions from "@/react/music/inversions/computeSciInversions";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";

const C_MAJOR_ROOT = "C" as const;
const SONG_KEY_C = "C" as const;
const MAJOR_SHAPE_CODE = "M";
const FIRST_INVERSION_BASS = "E";
const SECOND_INVERSION_BASS = "G";
const EXPECTED_MAP_ENTRIES_FOR_TRIAD = 2;
const EMPTY_MAP_SIZE = 0;

const SELECTED_ROOT_C: SelectedRoot = {
	root: "C",
	rootType: "absolute",
	label: "C",
};

describe("computeInversionPreviewTokens", () => {
	it("returns an empty map when no inversions are provided", () => {
		// Arrange
		const inversionBaseShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = computeInversionPreviewTokens({
			inversions: [],
			selectedRoot: SELECTED_ROOT_C,
			inversionBaseShape,
			songKey: SONG_KEY_C,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		// Assert
		expect(result.size).toStrictEqual(EMPTY_MAP_SIZE);
	});

	it("returns a map entry for each inversion bass note of C major", () => {
		// Arrange
		const inversions = computeSciInversions(C_MAJOR_ROOT, MAJOR_SHAPE_CODE);
		const inversionBaseShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = computeInversionPreviewTokens({
			inversions,
			selectedRoot: SELECTED_ROOT_C,
			inversionBaseShape,
			songKey: SONG_KEY_C,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		// Assert
		expect(result.size).toStrictEqual(EXPECTED_MAP_ENTRIES_FOR_TRIAD);
		expect(result.has(FIRST_INVERSION_BASS)).toBe(true);
		expect(result.has(SECOND_INVERSION_BASS)).toBe(true);
	});

	it("produces non-empty preview strings for each C major inversion in letter mode", () => {
		// Arrange
		const inversions = computeSciInversions(C_MAJOR_ROOT, MAJOR_SHAPE_CODE);
		const inversionBaseShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = computeInversionPreviewTokens({
			inversions,
			selectedRoot: SELECTED_ROOT_C,
			inversionBaseShape,
			songKey: SONG_KEY_C,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		// Assert
		expect(result.get(FIRST_INVERSION_BASS)).toBeTruthy();
		expect(result.get(SECOND_INVERSION_BASS)).toBeTruthy();
	});

	it("produces an empty preview string when inversionBaseShape is undefined (token cannot be resolved)", () => {
		// Arrange
		const inversions = computeSciInversions(C_MAJOR_ROOT, MAJOR_SHAPE_CODE);

		// Act – undefined shape → computeCanonicalRootAndShape returns undefined shapeCode → token = undefined → preview = ""
		const result = computeInversionPreviewTokens({
			inversions,
			selectedRoot: SELECTED_ROOT_C,
			inversionBaseShape: undefined,
			songKey: SONG_KEY_C,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		// Assert
		const EMPTY_PREVIEW = "";
		expect(result.get(FIRST_INVERSION_BASS)).toBe(EMPTY_PREVIEW);
		expect(result.get(SECOND_INVERSION_BASS)).toBe(EMPTY_PREVIEW);
	});
});
