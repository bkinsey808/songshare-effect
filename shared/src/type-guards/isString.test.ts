import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isString from "./isString";

const NUM_PRIMITIVE = 42;

describe("isString", () => {
	it("returns true for strings", () => {
		expect(isString("")).toBe(true);
		expect(isString("hello")).toBe(true);
	});

	it("returns false for non-strings", () => {
		expect(isString(makeNull())).toBe(false);
		expect(isString(undefined)).toBe(false);
		expect(isString(NUM_PRIMITIVE)).toBe(false);
		expect(isString(true)).toBe(false);
		expect(isString({})).toBe(false);
		expect(isString([])).toBe(false);
	});
});
