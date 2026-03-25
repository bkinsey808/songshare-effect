import { describe, expect, it } from "vitest";

import tryParseJsonFromString from "./tryParseJsonFromString";

describe("tryParseJsonFromString", () => {
	// Arrange - parsed inputs table
	const parsedCases: [string, unknown][] = [
		['  {"first":1}  ', { first: 1 }],
		['error: {"second":"x"} (details)', { second: "x" }],
		['info => {"outer":{"inner":2}} <--', { outer: { inner: 2 } }],
	];

	it.each(parsedCases)("parses %s", (input, expected) => {
		// Act
		const got = tryParseJsonFromString(input);

		// Assert
		expect(got).toStrictEqual(expected);
	});

	const undefinedCases: [string][] = [["no json here"], ["prefix {not:valid} suffix"]];

	it.each(undefinedCases)("returns undefined for %s", (input) => {
		// Act
		const got = tryParseJsonFromString(input);

		// Assert
		expect(got).toBeUndefined();
	});
});
