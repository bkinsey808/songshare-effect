import { describe, expect, it } from "vitest";

import filterAbsolutesByNoteSearch from "@/react/music/note-picker/filterAbsolutesByNoteSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const C_SEMITONE = 0;
const D_SEMITONE = 2;
const E_SEMITONE = 4;
const G_SEMITONE = 7;

/** C major triad: C, E, G */
const C_MAJOR = new Set([C_SEMITONE, E_SEMITONE, G_SEMITONE]);

function state(
	entries: [number, NoteSearchToggleState][],
): ReadonlyMap<number, NoteSearchToggleState> {
	return new Map(entries);
}

describe("filterAbsolutesByNoteSearch", () => {
	it.each([
		{
			name: "returns true when noteSearchState is empty",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([]),
			expected: true,
		},
		{
			name: "returns true when a required semitone is present",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([[C_SEMITONE, "required"]]),
			expected: true,
		},
		{
			name: "returns false when a required semitone is absent",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([[D_SEMITONE, "required"]]),
			expected: false,
		},
		{
			name: "returns true when an excluded semitone is absent",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([[D_SEMITONE, "excluded"]]),
			expected: true,
		},
		{
			name: "returns false when an excluded semitone is present",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([[G_SEMITONE, "excluded"]]),
			expected: false,
		},
		{
			name: "returns true when all required are present and all excluded are absent",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([
				[C_SEMITONE, "required"],
				[G_SEMITONE, "required"],
				[D_SEMITONE, "excluded"],
			]),
			expected: true,
		},
		{
			name: "returns false when a required semitone is absent even if excluded constraint is satisfied",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([
				[D_SEMITONE, "required"],
				[G_SEMITONE, "excluded"],
			]),
			expected: false,
		},
		{
			name: "returns false when an excluded semitone is present even if required constraint is satisfied",
			absoluteSemitones: C_MAJOR,
			noteSearchState: state([
				[C_SEMITONE, "required"],
				[G_SEMITONE, "excluded"],
			]),
			expected: false,
		},
	])("$name", ({ absoluteSemitones, noteSearchState, expected }) => {
		// Act
		const result = filterAbsolutesByNoteSearch(absoluteSemitones, noteSearchState);

		// Assert
		expect(result).toBe(expected);
	});
});
