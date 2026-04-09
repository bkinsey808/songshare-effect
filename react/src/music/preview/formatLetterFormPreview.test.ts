import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import formatLetterFormPreview from "@/react/music/preview/formatLetterFormPreview";
import type { SelectedRoot } from "@/react/music/root-picker/selected-root.type";
import type { ChordShape } from "@/shared/music/chord-shapes";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

const SONG_KEY_G = "G" as const;
const SONG_KEY_C = "C" as const;
const SONG_KEY_A = "A" as const;
const EMPTY_SONG_KEY = "" as const;

const ABSOLUTE_ROOT_G: SelectedRoot = { root: "G", rootType: "absolute", label: "G" };
const ABSOLUTE_ROOT_C: SelectedRoot = { root: "C", rootType: "absolute", label: "C" };
const ABSOLUTE_ROOT_A: SelectedRoot = { root: "A", rootType: "absolute", label: "A" };
const ROMAN_ROOT_I: SelectedRoot = { root: "I", rootType: "roman", label: "I" };

describe("formatLetterFormPreview", () => {
	it.each([
		{
			name: "returns note names for G major in letters mode",
			selectedRoot: ABSOLUTE_ROOT_G,
			spelling: "3,5",
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
			expected: "G B D",
		},
		{
			name: "formats note names in German mode (B natural → H)",
			selectedRoot: ABSOLUTE_ROOT_G,
			spelling: "3,5",
			chordDisplayMode: ChordDisplayMode.german,
			songKey: SONG_KEY_G,
			expected: "G H D",
		},
		{
			name: "resolves roman root I to G when song key is G",
			selectedRoot: ROMAN_ROOT_I,
			spelling: "3,5",
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
			expected: "G B D",
		},
	])("$name", ({ selectedRoot, spelling, chordDisplayMode, songKey, expected }) => {
		// Arrange
		const selectedShape = forceCast<ChordShape>({ spelling });

		// Act
		const result = formatLetterFormPreview({
			selectedRoot,
			selectedShape,
			chordDisplayMode,
			songKey,
		});

		// Assert
		expect(result).toBe(expected);
	});

	it.each([
		{
			name: "converts ♭5 to ♯4 when 5 is present and 4 is absent",
			selectedRoot: ABSOLUTE_ROOT_A,
			songKey: SONG_KEY_A,
			spelling: "b5,5",
			expected: "A D♯ E",
		},
		{
			name: "keeps ♭5 when 4 is also present (lower natural occupied)",
			selectedRoot: ABSOLUTE_ROOT_A,
			songKey: SONG_KEY_A,
			spelling: "4,b5,5",
			expected: "A D E♭ E",
		},
		{
			name: "keeps ♭5 when 5 is absent (same natural not present)",
			selectedRoot: ABSOLUTE_ROOT_A,
			songKey: SONG_KEY_A,
			spelling: "b5",
			expected: "A E♭",
		},
		{
			name: "converts ♭6 to ♯5 when 6 is present and 5 is absent",
			selectedRoot: ABSOLUTE_ROOT_C,
			songKey: SONG_KEY_C,
			spelling: "b6,6",
			expected: "C G♯ A",
		},
		{
			name: "keeps ♭2 when root is the lower natural (C prevents D♭ → C♯)",
			selectedRoot: ABSOLUTE_ROOT_C,
			songKey: SONG_KEY_C,
			spelling: "b2,2",
			expected: "C D♭ D",
		},
	])("sharp preference: $name", ({ selectedRoot, songKey, spelling, expected }) => {
		// Arrange
		const selectedShape = forceCast<ChordShape>({ spelling });

		// Act
		const result = formatLetterFormPreview({
			selectedRoot,
			selectedShape,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey,
		});

		// Assert
		expect(result).toBe(expected);
	});

	it("returns an empty string when the root cannot be resolved (roman root with no song key)", () => {
		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ROMAN_ROOT_I,
			selectedShape: undefined,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: EMPTY_SONG_KEY,
		});

		// Assert
		expect(result).toBe("");
	});

	it("returns only the root note when the selected shape is undefined", () => {
		// Act
		const result = formatLetterFormPreview({
			selectedRoot: ABSOLUTE_ROOT_G,
			selectedShape: undefined,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_G,
		});

		// Assert
		expect(result).toBe("G");
	});

	it("returns only the root note when the selected shape has an empty spelling", () => {
		// Arrange
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
