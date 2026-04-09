import { describe, expect, it } from "vitest";

import preferSharpIntervals from "@/react/music/intervals/preferSharpIntervals";

describe("preferSharpIntervals", () => {
	it.each([
		{
			name: "returns empty string unchanged",
			spelling: "",
			expected: "",
		},
		{
			name: "converts b5 to #4 when 5 is present and 4 is absent",
			spelling: "b5,5",
			expected: "#4,5",
		},
		{
			name: "keeps b5 when lowerNatural 4 is present",
			spelling: "4,b5,5",
			expected: "4,b5,5",
		},
		{
			name: "keeps b3 when sameNatural 3 is absent",
			spelling: "b3,5",
			expected: "b3,5",
		},
		{
			name: "never converts b2 to #1 because root 1 is always treated as present",
			spelling: "b2,3",
			expected: "b2,3",
		},
		{
			name: "passes non-flat intervals through unchanged",
			spelling: "3,5,7",
			expected: "3,5,7",
		},
	])("$name", ({ spelling, expected }) => {
		// Act
		const result = preferSharpIntervals(spelling);

		// Assert
		expect(result).toBe(expected);
	});
});
