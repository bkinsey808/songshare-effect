import { describe, expect, it } from "vitest";

import computeNoteSearchEntries from "@/react/music/note-picker/computeNoteSearchEntries";
import type { NoteSearchToggleState } from "@/react/music/note-picker/NoteSearchToggleState.type";

const ROOT_SEMITONE = 0;
const FIFTH_SEMITONE = 7;

const EMPTY_STATE = new Map<number, NoteSearchToggleState>();

describe("computeNoteSearchEntries", () => {
	it.each([
		{
			name: "entry at offset 0 has default state and no letterName when absoluteRoot is undefined",
			params: { absoluteRoot: undefined, songKey: "" as const, noteSearchState: EMPTY_STATE },
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "default",
				displayInterval: "I",
				letterName: undefined,
			},
		},
		{
			name: "root position shows I with correct letterName when absoluteRoot matches songKey",
			params: { absoluteRoot: "C" as const, songKey: "C" as const, noteSearchState: EMPTY_STATE },
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "default",
				displayInterval: "I",
				letterName: "C",
			},
		},
		{
			name: "fifth position shows V with correct letterName when absoluteRoot and songKey are both C",
			params: { absoluteRoot: "C" as const, songKey: "C" as const, noteSearchState: EMPTY_STATE },
			index: FIFTH_SEMITONE,
			expected: {
				semitoneOffset: FIFTH_SEMITONE,
				toggleState: "default",
				displayInterval: "V",
				letterName: "G",
			},
		},
		{
			name: "root position shows V when absoluteRoot is G and songKey is C",
			params: { absoluteRoot: "G" as const, songKey: "C" as const, noteSearchState: EMPTY_STATE },
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "default",
				displayInterval: "V",
				letterName: "G",
			},
		},
		{
			name: "entry reflects required toggleState when absolute semitone is in noteSearchState",
			params: {
				absoluteRoot: "C" as const,
				songKey: "C" as const,
				noteSearchState: new Map<number, NoteSearchToggleState>([[ROOT_SEMITONE, "required"]]),
			},
			index: ROOT_SEMITONE,
			expected: {
				semitoneOffset: ROOT_SEMITONE,
				toggleState: "required",
				displayInterval: "I",
				letterName: "C",
			},
		},
		{
			name: "entry reflects excluded toggleState when absolute semitone is in noteSearchState",
			params: {
				absoluteRoot: "C" as const,
				songKey: "C" as const,
				noteSearchState: new Map<number, NoteSearchToggleState>([[FIFTH_SEMITONE, "excluded"]]),
			},
			index: FIFTH_SEMITONE,
			expected: {
				semitoneOffset: FIFTH_SEMITONE,
				toggleState: "excluded",
				displayInterval: "V",
				letterName: "G",
			},
		},
	])("$name", ({ params, index, expected }) => {
		// Act
		const result = computeNoteSearchEntries(params);

		// Assert
		expect(result[index]).toStrictEqual(expected);
	});
});
