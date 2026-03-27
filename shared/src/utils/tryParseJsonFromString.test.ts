import { describe, expect, it } from "vitest";

import tryParseJsonFromString from "./tryParseJsonFromString";

describe("tryParseJsonFromString", () => {
	// Arrange - parsed inputs table
	const parsedCases = [
		{ name: "trimmed object", input: '  {"first":1}  ', expected: { first: 1 } },
		{ name: "embedded json", input: 'error: {"second":"x"} (details)', expected: { second: "x" } },
		{
			name: "nested json",
			input: 'info => {"outer":{"inner":2}} <--',
			expected: { outer: { inner: 2 } },
		},
	];

	it.each(parsedCases)("$name returns parsed object", ({ input, expected }) => {
		// Act
		const got = tryParseJsonFromString(input);

		// Assert
		expect(got).toStrictEqual(expected);
	});

	const undefinedCases = [
		{ name: "no json", input: "no json here" },
		{ name: "invalid braces", input: "prefix {not:valid} suffix" },
	];

	it.each(undefinedCases)("$name returns undefined", ({ input }) => {
		// Act
		const got = tryParseJsonFromString(input);

		// Assert
		expect(got).toBeUndefined();
	});
});
