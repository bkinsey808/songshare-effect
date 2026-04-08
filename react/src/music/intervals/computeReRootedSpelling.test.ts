import { describe, expect, it } from "vitest";

import computeReRootedSpelling from "./computeReRootedSpelling";

const ROOT_OFFSET = 0;
const MAJOR_THIRD_OFFSET = 4;
const PERFECT_FIFTH_OFFSET = 7;
const AUGMENTED_FIFTH_OFFSET = 8;
const OUT_OF_RANGE_OFFSET = 13;

const C_MAJOR_OFFSETS = [ROOT_OFFSET, MAJOR_THIRD_OFFSET, PERFECT_FIFTH_OFFSET];
const POWER_CHORD_OFFSETS = [ROOT_OFFSET, PERFECT_FIFTH_OFFSET];
const AUGMENTED_OFFSETS = [ROOT_OFFSET, MAJOR_THIRD_OFFSET, AUGMENTED_FIFTH_OFFSET];
const OUT_OF_RANGE_OFFSETS = [ROOT_OFFSET, OUT_OF_RANGE_OFFSET];

describe("computeReRootedSpelling", () => {
	it.each([
		{
			name: "re-roots a major chord on its fifth, remapping lower notes via octave wrap",
			allOffsets: C_MAJOR_OFFSETS,
			candidateRootOffset: PERFECT_FIFTH_OFFSET,
			expected: "4,6",
		},
		{
			name: "re-roots a major chord on its third, sorting remapped offsets ascending",
			allOffsets: C_MAJOR_OFFSETS,
			candidateRootOffset: MAJOR_THIRD_OFFSET,
			expected: "b3,b6",
		},
		{
			name: "re-roots a two-note chord on its second note, returning a single-interval spelling",
			allOffsets: POWER_CHORD_OFFSETS,
			candidateRootOffset: PERFECT_FIFTH_OFFSET,
			expected: "4",
		},
		{
			name: "re-roots an augmented chord on its major third",
			allOffsets: AUGMENTED_OFFSETS,
			candidateRootOffset: MAJOR_THIRD_OFFSET,
			expected: "3,b6",
		},
		{
			name: "returns undefined when a remapped offset falls outside the label index range",
			// (0 - 13 + 12) % 12 = -1, which has no label
			allOffsets: OUT_OF_RANGE_OFFSETS,
			candidateRootOffset: OUT_OF_RANGE_OFFSET,
			expected: undefined,
		},
	])("$name", ({ allOffsets, candidateRootOffset, expected }) => {
		// Act
		const result = computeReRootedSpelling(allOffsets, candidateRootOffset);

		// Assert
		expect(result).toBe(expected);
	});
});
