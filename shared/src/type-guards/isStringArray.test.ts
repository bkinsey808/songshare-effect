import { describe, expect, it } from "vitest";

import isStringArray from "./isStringArray";

const FIRST_NUM = 1;
const SECOND_NUM = 2;
const THIRD_NUM = 3;

describe("isStringArray", () => {
	const truthyCases = [
		{ name: "string array", value: ["a", "b"], expected: true },
		{ name: "empty array", value: [], expected: true },
	] as const;

	it.each(truthyCases)("returns true for $name", ({ value, expected }) => {
		// Act
		const result = isStringArray(value);

		// Assert
		expect(result).toBe(expected);
	});

	const falsyCases = [
		{ name: "non-array", value: "not an array", expected: false },
		{ name: "number array", value: [FIRST_NUM, SECOND_NUM, THIRD_NUM], expected: false },
	] as const;

	it.each(falsyCases)("returns false for $name", ({ value, expected }) => {
		// Act
		const result = isStringArray(value);

		// Assert
		expect(result).toBe(expected);
	});
});
