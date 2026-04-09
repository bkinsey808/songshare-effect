import { describe, expect, it } from "vitest";

import computeRootPickerDisplayMode from "@/react/music/root-picker/computeRootPickerDisplayMode";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

const SONG_KEY_G = "G" as const;
const EMPTY_SONG_KEY = "" as const;

describe("computeRootPickerDisplayMode", () => {
	it.each([
		{
			name: "falls back to letters mode when category is scaleDegree and songKey is empty",
			params: {
				chordDisplayCategory: ChordDisplayCategory.scaleDegree,
				songKey: EMPTY_SONG_KEY,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				chordDisplayMode: ChordDisplayMode.roman,
			} as const,
			expected: ChordDisplayMode.letters,
		},
		{
			name: "returns the supplied chordDisplayMode when category is scaleDegree and songKey is set",
			params: {
				chordDisplayCategory: ChordDisplayCategory.scaleDegree,
				songKey: SONG_KEY_G,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				chordDisplayMode: ChordDisplayMode.roman,
			} as const,
			expected: ChordDisplayMode.roman,
		},
		{
			name: "returns the supplied chordDisplayMode when category is letters regardless of songKey",
			params: {
				chordDisplayCategory: ChordDisplayCategory.letters,
				songKey: EMPTY_SONG_KEY,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				chordDisplayMode: ChordDisplayMode.letters,
			} as const,
			expected: ChordDisplayMode.letters,
		},
	])("$name", ({ params, expected }) => {
		expect(computeRootPickerDisplayMode(params)).toStrictEqual(expected);
	});
});
