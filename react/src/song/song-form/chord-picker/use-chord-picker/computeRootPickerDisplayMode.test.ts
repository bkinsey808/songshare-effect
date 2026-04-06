import { describe, expect, it } from "vitest";

import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import computeRootPickerDisplayMode from "./computeRootPickerDisplayMode";

const SONG_KEY_G = "G" as const;
const EMPTY_SONG_KEY = "" as const;

describe("computeRootPickerDisplayMode", () => {
	it("falls back to letters mode when category is scaleDegree and songKey is empty", () => {
		// Arrange
		const params = {
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			songKey: EMPTY_SONG_KEY,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			chordDisplayMode: ChordDisplayMode.roman,
		} as const;

		// Act
		const result = computeRootPickerDisplayMode(params);

		// Assert
		expect(result).toStrictEqual(ChordDisplayMode.letters);
	});

	it("returns the supplied chordDisplayMode when category is scaleDegree and songKey is set", () => {
		// Arrange
		const params = {
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			songKey: SONG_KEY_G,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			chordDisplayMode: ChordDisplayMode.roman,
		} as const;

		// Act
		const result = computeRootPickerDisplayMode(params);

		// Assert
		expect(result).toStrictEqual(ChordDisplayMode.roman);
	});

	it("returns the supplied chordDisplayMode when category is letters regardless of songKey", () => {
		// Arrange
		const params = {
			chordDisplayCategory: ChordDisplayCategory.letters,
			songKey: EMPTY_SONG_KEY,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			chordDisplayMode: ChordDisplayMode.letters,
		} as const;

		// Act
		const result = computeRootPickerDisplayMode(params);

		// Assert
		expect(result).toStrictEqual(ChordDisplayMode.letters);
	});
});
