import { describe, expect, it } from "vitest";

import computeAbsoluteSemitones from "@/react/music/intervals/computeAbsoluteSemitones";

const C_SEMITONE = 0;
const D_SEMITONE = 2;
const Eb_SEMITONE = 3;
const E_SEMITONE = 4;
const G_SEMITONE = 7;
const Bb_SEMITONE = 10;
const B_SEMITONE = 11;

describe("computeAbsoluteSemitones", () => {
	it.each([
		{
			name: "returns only the root semitone when spelling is empty",
			spelling: "",
			rootSemitone: C_SEMITONE,
			expected: new Set([C_SEMITONE]),
		},
		{
			name: "returns root and fifth for a single-interval spelling",
			spelling: "5",
			rootSemitone: C_SEMITONE,
			expected: new Set([C_SEMITONE, G_SEMITONE]),
		},
		{
			name: "returns all chord tones for a multi-interval spelling",
			// C minor triad: C, Eb, G
			spelling: "b3,5",
			rootSemitone: C_SEMITONE,
			expected: new Set([C_SEMITONE, Eb_SEMITONE, G_SEMITONE]),
		},
		{
			name: "wraps semitone values past 11 back into the 0–11 range",
			// G major triad: G(7), B(11), D(14 % 12 = 2)
			spelling: "3,5",
			rootSemitone: G_SEMITONE,
			expected: new Set([G_SEMITONE, B_SEMITONE, D_SEMITONE]),
		},
		{
			name: "handles four-note spellings correctly",
			// C dominant 7th: C, E, G, Bb
			spelling: "3,5,b7",
			rootSemitone: C_SEMITONE,
			expected: new Set([C_SEMITONE, E_SEMITONE, G_SEMITONE, Bb_SEMITONE]),
		},
		{
			name: "ignores unknown interval labels",
			spelling: "xyz",
			rootSemitone: C_SEMITONE,
			expected: new Set([C_SEMITONE]),
		},
	])("$name", ({ spelling, rootSemitone, expected }) => {
		// Act
		const result = computeAbsoluteSemitones(spelling, rootSemitone);

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
