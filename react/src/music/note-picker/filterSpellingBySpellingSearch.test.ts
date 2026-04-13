import { describe, expect, it } from "vitest";

import filterSpellingBySpellingSearch from "@/react/music/note-picker/filterSpellingBySpellingSearch";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const ROOT_SEMITONE = 0;
const MAJOR_THIRD_SEMITONE = 4;
const PERFECT_FIFTH_SEMITONE = 7;

function state(
	entries: [number, NoteSearchToggleState][],
): ReadonlyMap<number, NoteSearchToggleState> {
	return new Map(entries);
}

describe("filterSpellingBySpellingSearch", () => {
	it.each([
		{
			name: "returns true when the search state is empty",
			spelling: "3,5",
			spellingSearchState: state([]),
			expected: true,
		},
		{
			name: "returns true when the required spelling is present",
			spelling: "3,5",
			spellingSearchState: state([[MAJOR_THIRD_SEMITONE, "required"]]),
			expected: true,
		},
		{
			name: "returns false when the required spelling is absent",
			spelling: "5",
			spellingSearchState: state([[MAJOR_THIRD_SEMITONE, "required"]]),
			expected: false,
		},
		{
			name: "returns false when an excluded spelling is present",
			spelling: "3,5",
			spellingSearchState: state([[PERFECT_FIFTH_SEMITONE, "excluded"]]),
			expected: false,
		},
		{
			name: "can exclude the root spelling as well",
			spelling: "3,5",
			spellingSearchState: state([[ROOT_SEMITONE, "excluded"]]),
			expected: false,
		},
	])("$name", ({ spelling, spellingSearchState, expected }) => {
		expect(filterSpellingBySpellingSearch(spelling, spellingSearchState)).toBe(expected);
	});
});
