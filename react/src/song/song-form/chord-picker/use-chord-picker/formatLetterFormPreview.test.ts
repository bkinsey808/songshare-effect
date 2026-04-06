import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { getChordShapeByCode, type ChordShape } from "@/shared/music/chord-shapes";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import formatLetterFormPreview from "./formatLetterFormPreview";

const SONG_KEY_G = "G" as const;
const EMPTY_SONG_KEY = "" as const;
const MAJOR_SHAPE_CODE = "M";
const G_MAJOR_PREVIEW = "G B D";
const EMPTY_PREVIEW = "";

const ABSOLUTE_ROOT_G: SelectedRoot = {
	root: "G",
	rootType: "absolute",
	label: "G",
};

const ROMAN_ROOT_I: SelectedRoot = {
	root: "I",
	rootType: "roman",
	label: "I",
};

describe("formatLetterFormPreview", () => {
	it("returns space-separated letter names for G major in letter mode", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
		});

		// Assert
		expect(result).toBe(G_MAJOR_PREVIEW);
	});

	it("returns an empty string when the root cannot be resolved (roman root with no song key)", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ROMAN_ROOT_I,
			selectedShape,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: EMPTY_SONG_KEY,
		});

		// Assert
		expect(result).toBe(EMPTY_PREVIEW);
	});

	it("returns only the root note when the selected shape is undefined", () => {
		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape: undefined,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
		});

		// Assert – only the root "G" is output (no spelling intervals to iterate)
		expect(result).toBe("G");
	});

	it("returns only the root note when the selected shape has an empty spelling", () => {
		// Arrange – forceCast simulates a shape with no intervals beyond the root
		const emptySpellingShape = forceCast<ChordShape>({ spelling: "" });

		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape: emptySpellingShape,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
		});

		// Assert
		expect(result).toBe("G");
	});
});
