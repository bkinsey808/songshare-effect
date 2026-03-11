import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import safeDelete, {
	safeArrayGet,
	safeArraySet,
	safeGet,
	safeSet,
	superSafeGet,
} from "./safe";

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
	it("returns value when key exists", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE, [KEY_B]: "two" };
		expect(safeGet(obj, KEY_A)).toBe(NUM_ONE);
		expect(safeGet(obj, KEY_B)).toBe("two");
	});

	it("returns undefined when key is absent", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };
		expect(safeGet(obj, KEY_B)).toBeUndefined();
	});

	it("returns default when key is absent and default provided", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };
		expect(safeGet(obj, KEY_B, NUM_NINETY_NINE)).toBe(NUM_NINETY_NINE);
		expect(safeGet(obj, KEY_B, "default")).toBe("default");
	});

	it("does not read from prototype", () => {
		const obj = forceCast<Record<string, unknown>>(Object.create({ inherited: "x" }));
		expect(safeGet(obj, "inherited")).toBeUndefined();
	});
});

describe("superSafeGet", () => {
	it("returns value when key exists", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };
		expect(superSafeGet(obj, KEY_A)).toBe(NUM_ONE);
	});

	it("throws when key is absent", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };
		expect(() => superSafeGet(obj, KEY_B)).toThrow(/missing key b/);
	});
});

describe("safeSet", () => {
	it("sets property on object", () => {
		const obj: Record<string, unknown> = {};
		safeSet(obj, "key", "value");
		expect(obj["key"]).toBe("value");
	});

	it("refuses to set prototype-polluting keys", () => {
		const obj: Record<string, unknown> = {};
		safeSet(obj, "__proto__", "ignored");
		safeSet(obj, "constructor", "ignored");
		safeSet(obj, "prototype", "ignored");
		expect(Object.keys(obj)).toHaveLength(EXPECTED_KEYS_LENGTH);
	});
});

describe("safeDelete", () => {
	it("returns true and deletes when key exists", () => {
		const obj: Record<string, unknown> = { [KEY_A]: NUM_ONE };
		expect(safeDelete(obj, KEY_A)).toBe(true);
		expect(Object.hasOwn(obj, KEY_A)).toBe(false);
	});

	it("returns false when key does not exist", () => {
		const obj: Record<string, unknown> = {};
		expect(safeDelete(obj, KEY_A)).toBe(false);
	});
});

describe("safeArrayGet", () => {
	it("returns element at valid index", () => {
		const arr = [NUM_TEN, NUM_TWENTY, NUM_THIRTY];
		expect(safeArrayGet(arr, INDEX_ZERO)).toBe(NUM_TEN);
		expect(safeArrayGet(arr, INDEX_ONE)).toBe(NUM_TWENTY);
		expect(safeArrayGet(arr, INDEX_TWO)).toBe(NUM_THIRTY);
	});

	it("returns undefined for out-of-bounds index", () => {
		const arr = [NUM_TEN, NUM_TWENTY];
		expect(safeArrayGet(arr, NEGATIVE_INDEX)).toBeUndefined();
		expect(safeArrayGet(arr, INDEX_TWO)).toBeUndefined();
		expect(safeArrayGet(arr, INDEX_OUT_OF_BOUNDS)).toBeUndefined();
	});

	it("returns default when provided and index invalid", () => {
		const arr = [NUM_TEN];
		expect(safeArrayGet(arr, NUM_FIVE, INDEX_ZERO)).toBe(INDEX_ZERO);
	});
});

describe("safeArraySet", () => {
	it("returns new array with value set at valid index", () => {
		const arr = [NUM_ONE, NUM_TWO, NUM_THREE];
		const result = safeArraySet(arr, INDEX_ONE, NUM_NINETY_NINE);
		expect(result).not.toBe(arr);
		expect(result[INDEX_ONE]).toBe(NUM_NINETY_NINE);
		expect(arr[INDEX_ONE]).toBe(NUM_TWO);
	});

	it("returns original array for invalid index", () => {
		const arr = [NUM_ONE, NUM_TWO];
		expect(safeArraySet(arr, NEGATIVE_INDEX, INDEX_ZERO)).toBe(arr);
		expect(safeArraySet(arr, INDEX_TWO, INDEX_ZERO)).toBe(arr);
	});
});
