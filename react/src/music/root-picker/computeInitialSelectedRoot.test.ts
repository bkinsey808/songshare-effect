import { describe, expect, it } from "vitest";

import computeInitialSelectedRoot from "@/react/music/root-picker/computeInitialSelectedRoot";

describe("computeInitialSelectedRoot", () => {
	it.each([
		{
			name: "returns the parsed absolute root in letters mode",
			params: {
				chordDisplayMode: "letters" as const,
				initialChordToken: "[Bb -]",
				songKey: "C" as const,
			},
			expected: { root: "Bb", rootType: "absolute", label: "Bb" },
		},
		{
			name: "returns the parsed roman root in roman mode",
			params: {
				chordDisplayMode: "roman" as const,
				initialChordToken: "[bIII ROng]",
				songKey: "C" as const,
			},
			expected: { root: "bIII", rootType: "roman", label: "bIII" },
		},
		{
			name: "defaults to I in roman mode when there is no initial token",
			params: {
				chordDisplayMode: "roman" as const,
				initialChordToken: undefined,
				songKey: "G" as const,
			},
			expected: { root: "I", rootType: "roman", label: "I" },
		},
	])("$name", ({ params, expected }) => {
		expect(computeInitialSelectedRoot(params)).toStrictEqual(expected);
	});
});
