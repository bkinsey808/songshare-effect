import { describe, expect, it } from "vitest";

import { getChordShapeByCode } from "@/shared/music/chord-shapes";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import type { SelectedRoot } from "../root-picker/chordPickerRootOptionTypes";
import computeAlternatePreview from "./computeAlternatePreview";

const SONG_KEY_G = "G" as const;
const EMPTY_SONG_KEY = "" as const;
const MAJOR_SHAPE_CODE = "M";
const CANONICAL_TOKEN_I_M = "[I M]";
const LABEL_SCALE_DEGREE_FORM = "Scale Degree Form";
const LABEL_LETTER_FORM = "Letter Form";
const LABEL_UNAVAILABLE = "—";
const EMPTY_TOKEN = "";
const G_MAJOR_NOTES = "G B D";

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

/** Stub translation function that returns the default value for all keys. */
function stubT(key: string, defaultValue: string): string {
	void key;
	return defaultValue;
}

describe("computeAlternatePreview", () => {
	it("shows Scale Degree Form label when the primary category is letters and a song key is set", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const { alternatePreviewLabel } = computeAlternatePreview({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			songKey: SONG_KEY_G,
			canonicalToken: CANONICAL_TOKEN_I_M,
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape,
			selectedBassNote: undefined,
			t: stubT,
		});

		// Assert
		expect(alternatePreviewLabel).toBe(LABEL_SCALE_DEGREE_FORM);
	});

	it("shows Letter Form label and includes note names when the primary category is scaleDegree with a key", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const { alternatePreviewLabel, alternatePreviewToken } = computeAlternatePreview({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			songKey: SONG_KEY_G,
			canonicalToken: CANONICAL_TOKEN_I_M,
			selectedRoot: ROMAN_ROOT_I,
			selectedShape,
			selectedBassNote: undefined,
			t: stubT,
		});

		// Assert
		expect(alternatePreviewLabel).toBe(LABEL_LETTER_FORM);
		expect(alternatePreviewToken).toContain(G_MAJOR_NOTES);
	});

	it("shows the unavailable dash label and empty token when alternate is scaleDegree but no song key is set", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act
		const { alternatePreviewLabel, alternatePreviewToken } = computeAlternatePreview({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			songKey: EMPTY_SONG_KEY,
			canonicalToken: CANONICAL_TOKEN_I_M,
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape,
			selectedBassNote: undefined,
			t: stubT,
		});

		// Assert
		expect(alternatePreviewLabel).toBe(LABEL_UNAVAILABLE);
		expect(alternatePreviewToken).toBe(EMPTY_TOKEN);
	});

	it("produces an empty token when hasScaleDegreeAlternatePreview is true but canonicalToken is undefined", () => {
		// Arrange
		const selectedShape = getChordShapeByCode(MAJOR_SHAPE_CODE);

		// Act – letters category + key set → alternate is scaleDegree; canonicalToken = undefined skips transform
		const { alternatePreviewToken } = computeAlternatePreview({
			chordDisplayCategory: ChordDisplayCategory.letters,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			songKey: SONG_KEY_G,
			canonicalToken: undefined,
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape,
			selectedBassNote: undefined,
			t: stubT,
		});

		// Assert
		expect(alternatePreviewToken).toBe(EMPTY_TOKEN);
	});
});
