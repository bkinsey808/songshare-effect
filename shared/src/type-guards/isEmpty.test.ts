import { describe, expect, it } from "vitest";

import isEmpty from "./isEmpty";

const ARRAY_ITEM_A = 1;
const ARRAY_ITEM_B = 2;
const TEST_ARRAY: number[] = [ARRAY_ITEM_A, ARRAY_ITEM_B];
const ZERO_NUMBER = 0;

describe("isEmpty", () => {
	const truthyCases = [
		{ name: "undefined", value: undefined },
		{ name: "empty string", value: "" },
		{ name: "whitespace string", value: "   \t\n" },
		{ name: "empty array", value: [] },
		{ name: "empty map", value: new Map() },
		{ name: "empty set", value: new Set() },
		{ name: "empty object", value: {} },
	] as const;

	it.each(truthyCases)("isEmpty: $name => true", ({ value }: { value: unknown }) => {
		// Act
		const got = isEmpty(value);

		// Assert
		expect(got).toBe(true);
	});

	const falsyCases = [
		{ name: "non-empty string", value: "hello" },
		{ name: "array with items", value: TEST_ARRAY },
		{ name: "object with prop", value: { foo: "bar" } },
		{ name: "zero number", value: ZERO_NUMBER },
		{ name: "false boolean", value: false },
	] as const;

	it.each(falsyCases)("isEmpty: $name => false", ({ value }: { value: unknown }) => {
		// Act
		const got = isEmpty(value);

		// Assert
		expect(got).toBe(false);
	});
});
