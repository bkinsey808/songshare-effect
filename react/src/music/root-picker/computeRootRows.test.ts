import { describe, expect, it } from "vitest";

import computeRootRows from "@/react/music/root-picker/computeRootRows";

const SECOND_ROW_INDEX = 1;
const FIRST_ROW_INDEX = 0;

describe("computeRootRows", () => {
	it.each([
		{
			name: "returns roman rows with both roman and letter labels when the song has a key",
			params: { chordDisplayMode: "roman" as const, songKey: "C" as const, includeAnyRoot: false },
			expected: {
				primary: { root: "#I", rootType: "roman", label: "♯I (D♭)" },
				secondary: { root: "bII", rootType: "roman", label: "♭II (D♭)" },
			},
		},
		{
			name: "returns roman rows with only roman labels when the song has no key",
			params: { chordDisplayMode: "roman" as const, songKey: "" as const, includeAnyRoot: false },
			expected: {
				primary: { root: "#I", rootType: "roman", label: "♯I" },
				secondary: { root: "bII", rootType: "roman", label: "♭II" },
			},
		},
		{
			name: "returns absolute rows formatted for the active display mode",
			params: {
				chordDisplayMode: "letters" as const,
				songKey: "C" as const,
				includeAnyRoot: false,
			},
			expected: {
				primary: { root: "C#", rootType: "absolute", label: "C♯" },
				secondary: { root: "Db", rootType: "absolute", label: "D♭" },
			},
		},
	])("$name", ({ params, expected }) => {
		expect(computeRootRows(params)[SECOND_ROW_INDEX]).toStrictEqual(expected);
	});

	it("prepends the Any root row when requested", () => {
		expect(
			computeRootRows({
				chordDisplayMode: "letters",
				songKey: "C",
				includeAnyRoot: true,
				anyLabel: "Any",
			})[FIRST_ROW_INDEX],
		).toStrictEqual({
			primary: { root: "any", rootType: "any", label: "Any" },
		});
	});
});
