import { describe, expect, it } from "vitest";

import { safeArrayGet, safeArraySet } from "@/shared/utils/safe";

describe("safe utils: arrays", () => {
	it("safeArrayGet returns the element if index is valid", () => {
		const arr = ["a", "b", "c"] as const;
		expect(safeArrayGet(arr, 1)).toBe("b");
	});

	it("safeArrayGet returns defaultValue if index is invalid", () => {
		const arr = [1, 2, 3];
		expect(safeArrayGet(arr, 5, 42)).toBe(42);
		expect(safeArrayGet(arr, -1)).toBe(undefined);
	});

	it("safeArraySet returns a new array with replaced value when index is valid", () => {
		const arr = [1, 2, 3] as ReadonlyArray<number>;
		const result = safeArraySet(arr, 1, 99);

		// new array
		expect(result).not.toBe(arr);
		expect(result[1]).toBe(99);
		// original unchanged
		expect(arr[1]).toBe(2);
	});

	it("safeArraySet returns the original array if index is invalid", () => {
		const arr = ["x"] as ReadonlyArray<string>;
		const result = safeArraySet(arr, 10, "y");

		expect(result).toBe(arr);
	});
});
