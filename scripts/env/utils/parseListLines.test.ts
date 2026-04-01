import { describe, expect, it } from "bun:test";

import parseListLines from "./parseListLines";

const LINE_A = "VAR_ALPHA";
const LINE_B = "VAR_BETA";
const COMMENT = "# a comment";
const WHITESPACE_ONLY = "   ";
const CUSTOM_MIN_LENGTH = 2;

describe("parseListLines", () => {
	const cases: {
		name: string;
		input: string;
		expected: string[];
	}[] = [
		{
			name: "empty string returns empty array",
			input: "",
			expected: [],
		},
		{
			name: "single valid line returns that line",
			input: LINE_A,
			expected: [LINE_A],
		},
		{
			name: "trims leading whitespace from lines",
			input: `  ${LINE_A}`,
			expected: [LINE_A],
		},
		{
			name: "trims trailing whitespace from lines",
			input: `${LINE_A}  `,
			expected: [LINE_A],
		},
		{
			name: "filters comment lines starting with #",
			input: COMMENT,
			expected: [],
		},
		{
			name: "filters lines that are only whitespace",
			input: WHITESPACE_ONLY,
			expected: [],
		},
		{
			name: "filters blank lines between content",
			input: `${LINE_A}\n\n${LINE_B}`,
			expected: [LINE_A, LINE_B],
		},
		{
			name: "handles Unix LF line endings",
			input: `${LINE_A}\n${LINE_B}`,
			expected: [LINE_A, LINE_B],
		},
		{
			name: "handles Windows CRLF line endings",
			input: `${LINE_A}\r\n${LINE_B}`,
			expected: [LINE_A, LINE_B],
		},
		{
			name: "skips comments and blank lines and keeps valid lines",
			input: `${COMMENT}\n\n${LINE_A}\n${COMMENT}\n${LINE_B}`,
			expected: [LINE_A, LINE_B],
		},
		{
			name: "preserves order of valid lines",
			input: `${LINE_B}\n${LINE_A}`,
			expected: [LINE_B, LINE_A],
		},
	];

	it.each(cases)("$name", ({ input, expected }) => {
		// Act
		const result = parseListLines(input);

		// Assert
		expect(result).toStrictEqual(expected);
	});

	it("custom minLineLength excludes lines shorter than the threshold", () => {
		// Arrange
		const input = `A\n${LINE_A}`;

		// Act
		const result = parseListLines(input, CUSTOM_MIN_LENGTH);

		// Assert
		expect(result).toStrictEqual([LINE_A]);
	});

	it("custom minLineLength of 0 includes all non-comment lines", () => {
		// Arrange
		const input = `A\n\n${COMMENT}`;
		const minLength = 0;

		// Act
		const result = parseListLines(input, minLength);

		// Assert
		expect(result).toStrictEqual(["A", ""]);
	});
});
