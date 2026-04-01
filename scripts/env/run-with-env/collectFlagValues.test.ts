import { describe, expect, it } from "bun:test";

import collectFlagValues from "./collectFlagValues";

const FLAG = "--config";
const OTHER_FLAG = "--other";
const VALUE_A = "config/a.list";
const VALUE_B = "config/b.list";
const FLAG_LIKE_VALUE = "--looks-like-a-flag";

describe("collectFlagValues", () => {
	const cases: {
		name: string;
		args: string[];
		flag: string;
		expected: string[];
	}[] = [
		{
			name: "empty args returns empty array",
			args: [],
			flag: FLAG,
			expected: [],
		},
		{
			name: "single flag with value returns that value",
			args: [FLAG, VALUE_A],
			flag: FLAG,
			expected: [VALUE_A],
		},
		{
			name: "flag at the end with no following value is ignored",
			args: [FLAG],
			flag: FLAG,
			expected: [],
		},
		{
			name: "multiple occurrences of the same flag returns all values in order",
			args: [FLAG, VALUE_A, FLAG, VALUE_B],
			flag: FLAG,
			expected: [VALUE_A, VALUE_B],
		},
		{
			name: "non-matching flag returns empty array",
			args: [OTHER_FLAG, VALUE_A],
			flag: FLAG,
			expected: [],
		},
		{
			name: "value that looks like a flag is still collected",
			args: [FLAG, FLAG_LIKE_VALUE],
			flag: FLAG,
			expected: [FLAG_LIKE_VALUE],
		},
		{
			name: "flag is not collected when interspersed with unrelated args",
			args: [OTHER_FLAG, VALUE_A, FLAG, VALUE_B],
			flag: FLAG,
			expected: [VALUE_B],
		},
		{
			name: "consecutive flags each collect their following value",
			args: [FLAG, VALUE_A, FLAG, FLAG_LIKE_VALUE],
			flag: FLAG,
			expected: [VALUE_A, FLAG_LIKE_VALUE],
		},
	];

	it.each(cases)("$name", ({ args, flag, expected }) => {
		// Act
		const result = collectFlagValues(args, flag);

		// Assert
		expect(result).toStrictEqual(expected);
	});
});
