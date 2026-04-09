import { describe, expect, it } from "vitest";

import computeRootRows from "@/react/music/root-picker/computeRootRows";

const SECOND_ROW_INDEX = 1;

describe("computeRootRows", () => {
	it.each([
		{
			name: "returns roman rows with unicode accidental labels",
			params: { chordDisplayMode: "roman" as const, songKey: "C" as const },
			expected: {
				primary: { root: "#I", rootType: "roman", label: "♯I" },
				secondary: { root: "bII", rootType: "roman", label: "♭II" },
			},
		},
		{
			name: "returns absolute rows formatted for the active display mode",
			params: { chordDisplayMode: "letters" as const, songKey: "C" as const },
			expected: {
				primary: { root: "C#", rootType: "absolute", label: "C♯" },
				secondary: { root: "Db", rootType: "absolute", label: "D♭" },
			},
		},
	])("$name", ({ params, expected }) => {
		expect(computeRootRows(params)[SECOND_ROW_INDEX]).toStrictEqual(expected);
	});
});
