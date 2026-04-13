import { describe, expect, it } from "vitest";

import computeSpellingSearchEntries from "@/react/music/note-picker/computeSpellingSearchEntries";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const ROOT_SEMITONE = 0;
const MAJOR_THIRD_SEMITONE = 4;
const EMPTY_STATE = new Map<number, NoteSearchToggleState>();

describe("computeSpellingSearchEntries", () => {
	it.each([
		{
			name: "returns interval labels without note letters when absoluteRoot is undefined",
			params: { absoluteRoot: undefined, spellingSearchState: EMPTY_STATE },
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "required",
				displayInterval: "1",
				letterName: undefined,
			},
		},
		{
			name: "returns note letters when the absolute root is resolved",
			params: { absoluteRoot: "C" as const, spellingSearchState: EMPTY_STATE },
			index: MAJOR_THIRD_SEMITONE,
			expected: {
				semitoneOffset: MAJOR_THIRD_SEMITONE,
				toggleState: "default",
				displayInterval: "3",
				letterName: "E",
			},
		},
		{
			name: "reflects required toggle state for an active spelling filter",
			params: {
				absoluteRoot: "C" as const,
				spellingSearchState: new Map<number, NoteSearchToggleState>([[MAJOR_THIRD_SEMITONE, "required"]]),
			},
			index: MAJOR_THIRD_SEMITONE,
			expected: {
				semitoneOffset: MAJOR_THIRD_SEMITONE,
				toggleState: "required",
				displayInterval: "3",
				letterName: "E",
			},
		},
		{
			name: "keeps the root spelling required even if no explicit state is stored",
			params: {
				absoluteRoot: "C" as const,
				spellingSearchState: new Map<number, NoteSearchToggleState>([[MAJOR_THIRD_SEMITONE, "excluded"]]),
			},
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "required",
				displayInterval: "1",
				letterName: "C",
			},
		},
	])("$name", ({ params, index, expected }) => {
		expect(computeSpellingSearchEntries(params)[index]).toStrictEqual(expected);
	});
});
