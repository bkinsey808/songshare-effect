import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { ChordShape } from "@/shared/music/chord-shapes";

import computeActiveSpellingIntervals from "./computeActiveSpellingIntervals";
import type { SciInversion } from "@/react/music/inversions/computeSciInversions";

describe("computeActiveSpellingIntervals", () => {
	it.each([
		{
			name: "returns re-rooted intervals when an inversion is active",
			activeInversion: forceCast<SciInversion>({ reRootedSpelling: "b3,b6" }),
			selectedShape: forceCast<ChordShape | undefined>(undefined),
			expected: ["b3", "b6"],
		},
		{
			name: "returns shape intervals when no inversion is active and the shape has a spelling",
			activeInversion: forceCast<SciInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape>({ spelling: "3,5" }),
			expected: ["3", "5"],
		},
		{
			name: "returns an empty array when no inversion is active and the shape spelling is empty",
			activeInversion: forceCast<SciInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape>({ spelling: "" }),
			expected: [],
		},
		{
			name: "returns an empty array when no inversion is active and selectedShape is undefined",
			activeInversion: forceCast<SciInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape | undefined>(undefined),
			expected: [],
		},
	])("$name", ({ activeInversion, selectedShape, expected }) => {
		// Act
		const result = computeActiveSpellingIntervals({ activeInversion, selectedShape });

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
