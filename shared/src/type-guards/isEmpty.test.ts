import { describe, expect, it } from "vitest";

import isEmpty from "./isEmpty";

const ARRAY_ITEM_A = 1;
const ARRAY_ITEM_B = 2;
const TEST_ARRAY: number[] = [ARRAY_ITEM_A, ARRAY_ITEM_B];
const ZERO_NUMBER = 0;

describe("isEmpty", () => {
	const truthyCases = [
		[undefined],
		[""],
		["   \t\n"],
		[[]],
		[new Map()],
		[new Set()],
		[{}],
	] as const;

	it.each(truthyCases)("isEmpty(%o) => true", (value: unknown) => {
		// Act
		const got = isEmpty(value);

		// Assert
		expect(got).toBe(true);
	});

	const falsyCases = [["hello"], [TEST_ARRAY], [{ foo: "bar" }], [ZERO_NUMBER], [false]] as const;

	it.each(falsyCases)("isEmpty(%o) => false", (value: unknown) => {
		// Act
		const got = isEmpty(value);

		// Assert
		expect(got).toBe(false);
	});
});
