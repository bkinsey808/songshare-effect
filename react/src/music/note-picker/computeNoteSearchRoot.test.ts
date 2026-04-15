import { describe, expect, it } from "vitest";

import computeNoteSearchRoot from "@/react/music/note-picker/computeNoteSearchRoot";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

/** Spelling for a chord containing only the root note. */
const ROOT_ONLY_SPELLING = "";
/** Spelling for a major triad (root + major third + perfect fifth). */
const MAJOR_SPELLING = "3,5";

const C_SEMITONE = 0;
const G_SEMITONE = 7;

/**
 * Build a readonly note-search map for tests.
 *
 * @param entries - Tuples of semitone index and toggle state.
 * @returns A `ReadonlyMap` suitable for `computeNoteSearchRoot` tests.
 */
function state(
	entries: [number, NoteSearchToggleState][],
): ReadonlyMap<number, NoteSearchToggleState> {
	return new Map(entries);
}

describe("computeNoteSearchRoot", () => {
	it.each([
		{
			name: "returns undefined when noteSearchState is empty",
			spelling: MAJOR_SPELLING,
			noteSearchState: state([]),
			expected: undefined,
		},
		{
			name: "returns undefined when only excluded states are present",
			spelling: MAJOR_SPELLING,
			noteSearchState: state([[C_SEMITONE, "excluded"]]),
			expected: undefined,
		},
		{
			name: "returns C when C is required and the chord is root-only",
			spelling: ROOT_ONLY_SPELLING,
			noteSearchState: state([[C_SEMITONE, "required"]]),
			expected: "C",
		},
		{
			name: "returns G when G is required and the chord is root-only",
			spelling: ROOT_ONLY_SPELLING,
			noteSearchState: state([[G_SEMITONE, "required"]]),
			expected: "G",
		},
		{
			name: "returns undefined when two required notes cannot coexist in a root-only chord",
			spelling: ROOT_ONLY_SPELLING,
			noteSearchState: state([
				[C_SEMITONE, "required"],
				[G_SEMITONE, "required"],
			]),
			expected: undefined,
		},
		{
			name: "returns Eb when G is required and C is excluded from a major triad",
			// C major {C,E,G} fails (C excluded); Db major {Db,F,Ab} fails (no G); D major {D,F#,A} fails; Eb major {Eb,G,Bb} passes
			spelling: MAJOR_SPELLING,
			noteSearchState: state([
				[G_SEMITONE, "required"],
				[C_SEMITONE, "excluded"],
			]),
			expected: "Eb",
		},
	])("$name", ({ spelling, noteSearchState, expected }) => {
		// Act
		const result = computeNoteSearchRoot(spelling, noteSearchState);

		// Assert
		expect(result).toBe(expected);
	});
});
