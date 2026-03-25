import { describe, expect, it } from "vitest";

import isStringArray from "./isStringArray";

const FIRST_NUM = 1;
const SECOND_NUM = 2;
const THIRD_NUM = 3;

describe("isStringArray", () => {
	const truthyCases = [
		[["a", "b"], true],
		[[], true],
	] as const;

	it.each(truthyCases)("returns true for %o", (value, expected) => {
		// Act
		const result = isStringArray(value);

		// Assert
		expect(result).toBe(expected);
	});

	const falsyCases = [
		["not an array", false],
		[[FIRST_NUM, SECOND_NUM, THIRD_NUM], false],
	] as const;

	it.each(falsyCases)("returns false for %o", (value, expected) => {
		// Act
		const result = isStringArray(value);

		// Assert
		expect(result).toBe(expected);
	});
});
