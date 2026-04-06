import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import type { ChordShape } from "@/shared/music/chord-shapes";

import getActiveSpellingIntervals from "./getActiveSpellingIntervals";
import type { ChordInversion } from "./getChordInversions";

describe("getActiveSpellingIntervals", () => {
	it.each([
		{
			name: "returns re-rooted intervals when an inversion is active",
			activeInversion: forceCast<ChordInversion>({ reRootedSpelling: "b3,b6" }),
			selectedShape: forceCast<ChordShape | undefined>(undefined),
			expected: ["b3", "b6"],
		},
		{
			name: "returns shape intervals when no inversion is active and the shape has a spelling",
			activeInversion: forceCast<ChordInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape>({ spelling: "3,5" }),
			expected: ["3", "5"],
		},
		{
			name: "returns an empty array when no inversion is active and the shape spelling is empty",
			activeInversion: forceCast<ChordInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape>({ spelling: "" }),
			expected: [],
		},
		{
			name: "returns an empty array when no inversion is active and selectedShape is undefined",
			activeInversion: forceCast<ChordInversion | undefined>(undefined),
			selectedShape: forceCast<ChordShape | undefined>(undefined),
			expected: [],
		},
	])("$name", ({ activeInversion, selectedShape, expected }) => {
		// Act
		const result = getActiveSpellingIntervals({ activeInversion, selectedShape });

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
