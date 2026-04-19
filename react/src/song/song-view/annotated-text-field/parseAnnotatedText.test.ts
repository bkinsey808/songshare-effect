import { describe, expect, it } from "vitest";

import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";

import parseAnnotatedText from "./parseAnnotatedText";

const SONG_KEY_C = "C" as const;
const PLAIN_TEXT = "Hello world";
const CHORD_AND_LANGUAGE_TEXT = "Hello [C -] world {es}hola";
const CONSECUTIVE_CHORDS_TEXT = "[C -]one[G -]two";
const STRIPPED_TOKENS_TEXT = "Hello [C -] world {es}hola";
const EXPECTED_PLAIN_SEGMENTS = [{ annotation: undefined, text: PLAIN_TEXT }];
const EXPECTED_ANNOTATED_SEGMENTS = [
	{ annotation: undefined, text: "Hello " },
	{ annotation: "Do -", text: " world " },
	{ annotation: "es", text: "hola" },
];
const EXPECTED_CONSECUTIVE_SEGMENTS = [
	{ annotation: "I -", text: "one" },
	{ annotation: "V -", text: "two" },
];
const EXPECTED_STRIPPED_SEGMENTS = [{ annotation: undefined, text: "Hello  world hola" }];

const cases = [
	{
		name: "returns a single plain segment when no tokens are present",
		text: PLAIN_TEXT,
		options: {
			extractChords: true,
			extractLanguageTags: true,
			chordDisplayMode: ChordDisplayMode.letters,
			songKey: SONG_KEY_C,
		},
		expected: EXPECTED_PLAIN_SEGMENTS,
	},
	{
		name: "extracts chord and language annotations into ordered segments",
		text: CHORD_AND_LANGUAGE_TEXT,
		options: {
			extractChords: true,
			extractLanguageTags: true,
			chordDisplayMode: ChordDisplayMode.solfege,
			songKey: SONG_KEY_C,
		},
		expected: EXPECTED_ANNOTATED_SEGMENTS,
	},
	{
		name: "preserves consecutive annotations on separate following text segments",
		text: CONSECUTIVE_CHORDS_TEXT,
		options: {
			extractChords: true,
			extractLanguageTags: false,
			chordDisplayMode: ChordDisplayMode.roman,
			songKey: SONG_KEY_C,
		},
		expected: EXPECTED_CONSECUTIVE_SEGMENTS,
	},
	{
		name: "strips recognized tokens silently when extraction is disabled",
		text: STRIPPED_TOKENS_TEXT,
		options: {
			extractChords: false,
			extractLanguageTags: false,
			chordDisplayMode: ChordDisplayMode.solfege,
			songKey: SONG_KEY_C,
		},
		expected: EXPECTED_STRIPPED_SEGMENTS,
	},
] as const;

describe("parseAnnotatedText", () => {
	it.each(cases)("$name", ({ text, options, expected }) => {
		// Act
		const result = parseAnnotatedText(text, options);

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
