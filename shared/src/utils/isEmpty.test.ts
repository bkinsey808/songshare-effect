import { describe, it, expect } from "vitest";

import isEmpty from "./isEmpty";

const ARRAY_ITEM_A = 1;
const ARRAY_ITEM_B = 2;
const TEST_ARRAY: number[] = [ARRAY_ITEM_A, ARRAY_ITEM_B];
const ZERO_NUMBER = 0;

describe("isEmpty", () => {
	it("returns true for undefined", () => {
		expect(isEmpty(undefined)).toBe(true);
	});

	it("handles strings (empty and whitespace-only)", () => {
		expect(isEmpty("")).toBe(true);
		expect(isEmpty("   \t\n")).toBe(true);
		expect(isEmpty("hello")).toBe(false);
	});

	it("handles arrays and containers", () => {
		expect(isEmpty([])).toBe(true);
		expect(isEmpty(TEST_ARRAY)).toBe(false);

		expect(isEmpty(new Map())).toBe(true);
		expect(isEmpty(new Set())).toBe(true);
	});

	it("handles objects", () => {
		expect(isEmpty({})).toBe(true);
		expect(isEmpty({ foo: "bar" })).toBe(false);
	});

	it("returns false for primitives like numbers", () => {
		expect(isEmpty(ZERO_NUMBER)).toBe(false);
		expect(isEmpty(false)).toBe(false);
	});
});
