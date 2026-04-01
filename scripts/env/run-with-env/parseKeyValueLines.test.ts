import { describe, expect, it } from "bun:test";

import parseKeyValueLines from "./parseKeyValueLines";

const KEY_A = "DB_HOST";
const VALUE_A = "localhost";
const KEY_B = "APP_SECRET";
const VALUE_B = "abc123";
const COMMENT = "# a comment";

describe("parseKeyValueLines", () => {
	const cases: {
		name: string;
		input: string;
		expected: Record<string, string>;
	}[] = [
		{
			name: "empty string returns empty object",
			input: "",
			expected: {},
		},
		{
			name: "simple KEY=VALUE pair is parsed",
			input: `${KEY_A}=${VALUE_A}`,
			expected: { [KEY_A]: VALUE_A },
		},
		{
			name: "comment line is skipped",
			input: `${COMMENT}\n${KEY_A}=${VALUE_A}`,
			expected: { [KEY_A]: VALUE_A },
		},
		{
			name: "blank line is skipped",
			input: `\n${KEY_A}=${VALUE_A}`,
			expected: { [KEY_A]: VALUE_A },
		},
		{
			name: "line without = is skipped",
			input: KEY_A,
			expected: {},
		},
		{
			name: "= at start of line (empty key) is skipped",
			input: `=${VALUE_A}`,
			expected: {},
		},
		{
			name: "whitespace around key and value is trimmed",
			input: `  ${KEY_A}  =  ${VALUE_A}  `,
			expected: { [KEY_A]: VALUE_A },
		},
		{
			name: "value containing = keeps everything after the first =",
			input: `${KEY_A}=${VALUE_A}=${VALUE_B}`,
			expected: { [KEY_A]: `${VALUE_A}=${VALUE_B}` },
		},
		{
			name: "multiple valid pairs are all parsed",
			input: `${KEY_A}=${VALUE_A}\n${KEY_B}=${VALUE_B}`,
			expected: { [KEY_A]: VALUE_A, [KEY_B]: VALUE_B },
		},
		{
			name: "Windows CRLF line endings are handled",
			input: `${KEY_A}=${VALUE_A}\r\n${KEY_B}=${VALUE_B}`,
			expected: { [KEY_A]: VALUE_A, [KEY_B]: VALUE_B },
		},
		{
			name: "empty value is stored as empty string",
			input: `${KEY_A}=`,
			expected: { [KEY_A]: "" },
		},
		{
			name: "comment and blank lines mixed with valid pairs",
			input: `${COMMENT}\n\n${KEY_A}=${VALUE_A}\n# skip\n${KEY_B}=${VALUE_B}`,
			expected: { [KEY_A]: VALUE_A, [KEY_B]: VALUE_B },
		},
	];

	it.each(cases)("$name", ({ input, expected }) => {
		// Act
		const result = parseKeyValueLines(input);

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
