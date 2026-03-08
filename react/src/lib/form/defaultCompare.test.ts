import { describe, expect, it } from "vitest";

import makeNull from "@/react/lib/test-utils/makeNull.test-util";

import defaultCompare from "./defaultCompare";

// Note: spy is created at module load time by the helper; individual
// tests may call `vi.resetAllMocks()` when they need a fresh spy.

describe("defaultCompare", () => {
	// Some tests clear mocks themselves rather than using hooks.

	it("returns false when two primitives are strictly equal", () => {
		// numeric literals make the assertion clearer

		const numA = Number("5");
		const numB = Number("5");
		expect(defaultCompare(numA, numB)).toBe(false);
		expect(defaultCompare("foo", "foo")).toBe(false);
	});

	it("returns true when two primitives are different", () => {
		const first = Number("5");
		const second = Number("10");
		expect(defaultCompare(first, second)).toBe(true);
		expect(defaultCompare("foo", "bar")).toBe(true);
	});

	it("correctly handles null and undefined combinations", () => {
		// equal null/undefined pairs should be treated as unchanged
		// obtain a null value through helper
		const nullValue = makeNull();
		expect(defaultCompare(nullValue, nullValue)).toBe(false);
		expect(defaultCompare(undefined, undefined)).toBe(false);

		// mismatched null/undefined->true
		expect(defaultCompare(nullValue, undefined)).toBe(true);
		expect(defaultCompare(undefined, nullValue)).toBe(true);
		expect(defaultCompare(nullValue, Number("0"))).toBe(true);
	});

	it("compares arrays by length and delegates element comparison recursively", () => {
		// different lengths
		const diffArr1 = [Number("1"), Number("2")];
		const diffArr2 = [Number("1")];
		expect(defaultCompare(diffArr1, diffArr2)).toBe(true);

		// same length, identical contents
		const letters = ["a", "b"];
		expect(defaultCompare(letters, letters)).toBe(false);

		// nested difference should bubble up
		const arr1 = [{ foo: "bar" }, { foo: "baz" }];
		const arr2 = [{ foo: "bar" }, { foo: "qux" }];
		expect(defaultCompare(arr1, arr2)).toBe(true);
	});

	it("compares plain objects by their fields (including non-strings)", () => {
		const firstObj = { alpha: "x", beta: "y", gamma: 1, delta: true };
		const secondObj = { alpha: "x", beta: "y", gamma: 1, delta: true };
		const thirdObj = { alpha: "x", beta: "y", gamma: 2, delta: true };
		const fourthObj = { alpha: "x", beta: "y", gamma: 1, delta: false };

		expect(defaultCompare(firstObj, secondObj)).toBe(false);
		expect(defaultCompare(firstObj, thirdObj)).toBe(true);
		expect(defaultCompare(firstObj, fourthObj)).toBe(true);
	});

	it("returns true when comparing object with a primitive", () => {
		// no reset needed here
		expect(defaultCompare({ alpha: "foo" } as unknown, "foo" as unknown)).toBe(true);
	});

	it("compares array vs object with numeric keys correctly", () => {
		// they are different types/structures and should be treated as different
		const arrA = [Number("1"), Number("2")] as unknown;
		const objWithNumericKeys = {
			[Number("0")]: Number("1"),
			[Number("1")]: Number("2"),
		} as unknown;
		expect(defaultCompare(arrA, objWithNumericKeys)).toBe(true);
	});
});
