import { describe, expect, it } from "vitest";

import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import formatChordAnnotation from "./formatChordAnnotation";

const SONG_KEY_C = "C" as const;
const INVALID_TOKEN = "H dim";
const SIMPLE_TOKEN = "C -";
const SLASH_TOKEN = "C M/E";
const INVALID_BASS_NOTE_TOKEN = "C M/xyz";
const SOLFEGE_RESULT = "Do -";
const SLASH_CHORD_RESULT = "I M/III";
const INVALID_BASS_NOTE_RESULT = "I M/xyz";

const cases = [
	{
		name: "returns undefined when the chord token body cannot be parsed",
		tokenBody: INVALID_TOKEN,
		chordDisplayMode: ChordDisplayMode.letters,
		songKey: SONG_KEY_C,
		expected: undefined,
	},
	{
		name: "formats a parsed chord token in the requested display mode",
		tokenBody: SIMPLE_TOKEN,
		chordDisplayMode: ChordDisplayMode.solfege,
		songKey: SONG_KEY_C,
		expected: SOLFEGE_RESULT,
	},
	{
		name: "formats slash-chord bass notes in the requested display mode",
		tokenBody: SLASH_TOKEN,
		chordDisplayMode: ChordDisplayMode.roman,
		songKey: SONG_KEY_C,
		expected: SLASH_CHORD_RESULT,
	},
	{
		name: "leaves an unrecognised slash-chord bass note unchanged",
		tokenBody: INVALID_BASS_NOTE_TOKEN,
		chordDisplayMode: ChordDisplayMode.roman,
		songKey: SONG_KEY_C,
		expected: INVALID_BASS_NOTE_RESULT,
	},
] as const;

describe("formatChordAnnotation", () => {
	it.each(cases)("$name", ({ tokenBody, chordDisplayMode, songKey, expected }) => {
		// Act
		const result = formatChordAnnotation({ tokenBody, chordDisplayMode, songKey });

		// Assert
		expect(result).toBe(expected);
	});
});
