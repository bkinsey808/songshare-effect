import { describe, expect, it } from "vitest";

import filterSpellingByNoteSearch from "@/react/music/note-picker/filterSpellingByNoteSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const C_SEMITONE = 0;
const D_SEMITONE = 2;
const G_SEMITONE = 7;
const B_SEMITONE = 11;

/** Spelling for a major triad (root + major third + perfect fifth). */
const MAJOR_SPELLING = "3,5";

/**
 * Build a readonly note-search map for tests.
 *
 * @param entries - Tuples of semitone index and toggle state.
 * @returns A `ReadonlyMap` for `noteSearchState` in tests.
 */
function state(
	entries: [number, NoteSearchToggleState][],
): ReadonlyMap<number, NoteSearchToggleState> {
	return new Map(entries);
}

describe("filterSpellingByNoteSearch", () => {
	it.each([
		{
			name: "returns true when noteSearchState is empty",
			spelling: MAJOR_SPELLING,
			bassRootSemitone: C_SEMITONE,
			noteSearchState: state([]),
			expected: true,
		},
		{
			name: "returns true when a required semitone is present in the resolved chord",
			// C major {C,E,G} = {0,4,7}; G(7) is present
			spelling: MAJOR_SPELLING,
			bassRootSemitone: C_SEMITONE,
			noteSearchState: state([[G_SEMITONE, "required"]]),
			expected: true,
		},
		{
			name: "returns false when a required semitone is absent from the resolved chord",
			// C major {C,E,G} = {0,4,7}; D(2) is absent
			spelling: MAJOR_SPELLING,
			bassRootSemitone: C_SEMITONE,
			noteSearchState: state([[D_SEMITONE, "required"]]),
			expected: false,
		},
		{
			name: "returns false when an excluded semitone is present in the resolved chord",
			// C major {C,E,G} = {0,4,7}; G(7) is present and excluded
			spelling: MAJOR_SPELLING,
			bassRootSemitone: C_SEMITONE,
			noteSearchState: state([[G_SEMITONE, "excluded"]]),
			expected: false,
		},
		{
			name: "returns true when bassRootSemitone shifts the chord to include the required semitone",
			// G major {G,B,D} = {7,11,2}; D(2) is present — would be absent at C root
			spelling: MAJOR_SPELLING,
			bassRootSemitone: G_SEMITONE,
			noteSearchState: state([[D_SEMITONE, "required"]]),
			expected: true,
		},
		{
			name: "returns false when bassRootSemitone shifts the chord away from a required semitone",
			// G major {G,B,D} = {7,11,2}; C(0) is absent — would be present at root 5 (F major)
			spelling: MAJOR_SPELLING,
			bassRootSemitone: G_SEMITONE,
			noteSearchState: state([[C_SEMITONE, "required"]]),
			expected: false,
		},
		{
			name: "returns true when all required are present and all excluded are absent",
			// G major {G,B,D} = {7,11,2}; G(7) and B(11) required, C(0) excluded
			spelling: MAJOR_SPELLING,
			bassRootSemitone: G_SEMITONE,
			noteSearchState: state([
				[G_SEMITONE, "required"],
				[B_SEMITONE, "required"],
				[C_SEMITONE, "excluded"],
			]),
			expected: true,
		},
	])("$name", ({ spelling, bassRootSemitone, noteSearchState, expected }) => {
		// Act
		const result = filterSpellingByNoteSearch(spelling, bassRootSemitone, noteSearchState);

		// Assert
		expect(result).toBe(expected);
	});
});
