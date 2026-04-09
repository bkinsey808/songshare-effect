import { describe, expect, it } from "vitest";

import filterShapeByNoteSearch from "@/react/music/note-picker/filterShapeByNoteSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";
import type { ChordShape } from "@/shared/music/chord-shapes";

const C_SEMITONE = 0;
const E_SEMITONE = 4;
const G_SEMITONE = 7;

/** Spelling for a major triad (root + major third + perfect fifth). */
const MAJOR_SPELLING = "3,5";
/**
 * Spelling for a whole-step dyad (root + major second).
 * Notes are always exactly 2 semitones apart, so C(0) and G(7) can never coexist.
 */
const WHOLE_STEP_SPELLING = "2";

function shape(spelling: string): ChordShape {
	return {
		id: 0,
		name: "",
		code: "",
		prefer: false,
		noteCount: 2,
		spelling,
		ordering: 0,
		intervalForm: "",
		altNames: "",
		searchText: "",
	};
}

function state(
	entries: [number, NoteSearchToggleState][],
): ReadonlyMap<number, NoteSearchToggleState> {
	return new Map(entries);
}

describe("filterShapeByNoteSearch", () => {
	it.each([
		{
			name: "returns true when noteSearchState is empty",
			chordShape: shape(MAJOR_SPELLING),
			noteSearchState: state([]),
			expected: true,
		},
		{
			name: "returns true when a required semitone is reachable by some rooting of the shape",
			// G(7) is present in C major {C,E,G} at root 0
			chordShape: shape(MAJOR_SPELLING),
			noteSearchState: state([[G_SEMITONE, "required"]]),
			expected: true,
		},
		{
			name: "returns true when required and excluded constraints are satisfied by some rooting",
			// E major {E,G#,B} has E(4) and no C(0); other roots with E also lack C
			chordShape: shape(MAJOR_SPELLING),
			noteSearchState: state([
				[E_SEMITONE, "required"],
				[C_SEMITONE, "excluded"],
			]),
			expected: true,
		},
		{
			name: "returns false when no rooting of the shape satisfies all required semitones",
			// Whole-step dyad notes are always 2 semitones apart — C(0) and G(7) can never coexist
			chordShape: shape(WHOLE_STEP_SPELLING),
			noteSearchState: state([
				[C_SEMITONE, "required"],
				[G_SEMITONE, "required"],
			]),
			expected: false,
		},
	])("$name", ({ chordShape, noteSearchState, expected }) => {
		// Act
		const result = filterShapeByNoteSearch(chordShape, noteSearchState);

		// Assert
		expect(result).toBe(expected);
	});
});
