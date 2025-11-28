/* eslint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import { isRecord, isString, isStringArray } from "./typeGuards";

describe("isRecord", () => {
	it("returns true for plain objects", () => {
		expect(isRecord({})).toBe(true);
		expect(isRecord({ a: 1 })).toBe(true);
	});

	it("returns true for arrays (arrays are objects at runtime)", () => {
		expect(isRecord([])).toBe(true);
		expect(isRecord([1, 2, 3])).toBe(true);
	});

	it("returns false for null and primitives", () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord(undefined)).toBe(false);
		expect(isRecord(42)).toBe(false);
		expect(isRecord("hello")).toBe(false);
	});
});

describe("isString", () => {
	it("identifies strings", () => {
		expect(isString("hello")).toBe(true);
		expect(isString(123)).toBe(false);
	});
});

describe("isStringArray", () => {
	it("returns true for arrays of strings", () => {
		expect(isStringArray(["a", "b"])).toBe(true);
	});

	it("returns false for non-arrays or arrays with non-strings", () => {
		expect(isStringArray("not an array")).toBe(false);
		expect(isStringArray([1, 2, 3])).toBe(false);
	});
});
