import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";

import safeDelete, { safeArrayGet, safeArraySet, safeGet, safeSet, superSafeGet } from "./safe";

const NUM_ONE = 1;
const NUM_TWO = 2;
const NUM_THREE = 3;
const NUM_FIVE = 5;
const NUM_TEN = 10;
const NUM_TWENTY = 20;
const NUM_THIRTY = 30;
const NUM_NINETY_NINE = 99;
const INDEX_ZERO = 0;
const INDEX_ONE = 1;
const INDEX_TWO = 2;
const INDEX_OUT_OF_BOUNDS = 99;
const NEGATIVE_INDEX = -1;
const EXPECTED_KEYS_LENGTH = 0;

const KEY_A = "a";
const KEY_B = "b";

describe("safeGet", () => {
	const presentCases = [
		{
			name: "numeric value",
			obj: { [KEY_A]: NUM_ONE, [KEY_B]: "two" },
			key: KEY_A,
			expected: NUM_ONE,
		},
		{
			name: "string value",
			obj: { [KEY_A]: NUM_ONE, [KEY_B]: "two" },
			key: KEY_B,
			expected: "two",
		},
	];

	it.each(presentCases)(
		"returns value when $name",
		({ obj, key, expected }: { obj: Record<string, unknown>; key: string; expected: unknown }) => {
			// Arrange
			const input = obj;
			const inputKey = key;

			// Act
			const got = safeGet(input, inputKey);

			// Assert
			expect(got).toBe(expected);
		},
	);

	it("returns undefined when key is absent", () => {
		// Arrange
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };

		// Act
		const got = safeGet(obj, KEY_B);

		// Assert
		expect(got).toBeUndefined();
	});

	const defaultCases = [
		{
			name: "numeric default",
			obj: { [KEY_A]: NUM_ONE },
			key: KEY_B,
			def: NUM_NINETY_NINE,
			expected: NUM_NINETY_NINE,
		},
		{
			name: "string default",
			obj: { [KEY_A]: NUM_ONE },
			key: KEY_B,
			def: "default",
			expected: "default",
		},
	];

	it.each(defaultCases)(
		"returns default when absent for $name",
		({
			obj,
			key,
			def,
			expected,
		}: {
			obj: Record<string, unknown>;
			key: string;
			def: unknown;
			expected: unknown;
		}) => {
			// Arrange
			const input = obj;
			const inputKey = key;
			const defaultValue = def;

			// Act
			const got = safeGet(input, inputKey, defaultValue);

			// Assert
			expect(got).toBe(expected);
		},
	);

	it("does not read from prototype", () => {
		// Arrange
		const obj = forceCast<Record<string, unknown>>(Object.create({ inherited: "x" }));

		// Act & Assert
		expect(safeGet(obj, "inherited")).toBeUndefined();
	});
});

describe("superSafeGet", () => {
	it("returns value when key exists", () => {
		// Arrange
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };

		// Act & Assert
		expect(superSafeGet(obj, KEY_A)).toBe(NUM_ONE);
	});

	it("throws when key is absent", () => {
		// Arrange
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };

		// Act & Assert
		expect(() => superSafeGet(obj, KEY_B)).toThrow(/missing key b/);
	});
});

describe("safeSet", () => {
	it("sets property on object", () => {
		// Arrange
		const obj: Record<string, unknown> = {};

		// Act
		safeSet(obj, "key", "value");

		// Assert
		expect(obj["key"]).toBe("value");
	});

	it("refuses to set prototype-polluting keys", () => {
		// Arrange
		const obj: Record<string, unknown> = {};

		// Act
		safeSet(obj, "__proto__", "ignored");
		safeSet(obj, "constructor", "ignored");
		safeSet(obj, "prototype", "ignored");

		// Assert
		expect(Object.keys(obj)).toHaveLength(EXPECTED_KEYS_LENGTH);
	});
});

describe("safeDelete", () => {
	it("returns true and deletes when key exists", () => {
		// Arrange
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };

		// Act & Assert
		expect(safeDelete(obj, KEY_A)).toBe(true);
		expect(Object.hasOwn(obj, KEY_A)).toBe(false);
	});

	it("returns false when key does not exist", () => {
		// Arrange
		const obj: Record<string, unknown> = {};

		// Act & Assert
		expect(safeDelete(obj, KEY_A)).toBe(false);
	});
});

describe("safeArrayGet", () => {
	const validIndexCases = [
		{
			name: "index 0",
			arr: [NUM_TEN, NUM_TWENTY, NUM_THIRTY],
			index: INDEX_ZERO,
			expected: NUM_TEN,
		},
		{
			name: "index 1",
			arr: [NUM_TEN, NUM_TWENTY, NUM_THIRTY],
			index: INDEX_ONE,
			expected: NUM_TWENTY,
		},
		{
			name: "index 2",
			arr: [NUM_TEN, NUM_TWENTY, NUM_THIRTY],
			index: INDEX_TWO,
			expected: NUM_THIRTY,
		},
	];

	it.each(validIndexCases)(
		"returns element at valid $name",
		({ arr, index, expected }: { arr: number[]; index: number; expected: number }) => {
			// Arrange
			const input = arr;
			const i = index;

			// Act
			const got = safeArrayGet(input, i);

			// Assert
			expect(got).toBe(expected);
		},
	);

	const outOfBoundsCases = [
		{ name: "negative index", arr: [NUM_TEN, NUM_TWENTY], index: NEGATIVE_INDEX },
		{ name: "index two", arr: [NUM_TEN, NUM_TWENTY], index: INDEX_TWO },
		{ name: "far out", arr: [NUM_TEN, NUM_TWENTY], index: INDEX_OUT_OF_BOUNDS },
	];

	it.each(outOfBoundsCases)(
		"returns undefined for $name",
		({ arr, index }: { arr: number[]; index: number }) => {
			// Arrange
			const input = arr;
			const i = index;

			// Act
			const got = safeArrayGet(input, i);

			// Assert
			expect(got).toBeUndefined();
		},
	);

	it("returns default when provided and index invalid", () => {
		// Arrange
		const arr = [NUM_TEN];

		// Act
		const got = safeArrayGet(arr, NUM_FIVE, INDEX_ZERO);

		// Assert
		expect(got).toBe(INDEX_ZERO);
	});
});

describe("safeArraySet", () => {
	it("returns new array with value set at valid index", () => {
		// Arrange
		const arr = [NUM_ONE, NUM_TWO, NUM_THREE];

		// Act
		const result = safeArraySet(arr, INDEX_ONE, NUM_NINETY_NINE);

		// Assert
		expect(result).not.toBe(arr);
		expect(result[INDEX_ONE]).toBe(NUM_NINETY_NINE);
		expect(arr[INDEX_ONE]).toBe(NUM_TWO);
	});

	const invalidSetCases = [
		{ name: "negative index", arr: [NUM_ONE, NUM_TWO], index: NEGATIVE_INDEX, value: INDEX_ZERO },
		{ name: "index two", arr: [NUM_ONE, NUM_TWO], index: INDEX_TWO, value: INDEX_ZERO },
	];

	it.each(invalidSetCases)(
		"returns original array for $name",
		({ arr, index, value }: { arr: number[]; index: number; value: number }) => {
			// Arrange
			const input = arr;

			// Act & Assert
			expect(safeArraySet(input, index, value)).toBe(input);
		},
	);
});
