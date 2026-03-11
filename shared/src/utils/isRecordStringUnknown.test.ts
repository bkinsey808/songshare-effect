import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isRecordStringUnknown from "./isRecordStringUnknown";

const FIRST = 1;
const SECOND = 2;
const NUM_PRIMITIVE = 42;

describe("isRecordStringUnknown", () => {
	it("returns true for plain objects", () => {
		expect(isRecordStringUnknown({})).toBe(true);
		expect(isRecordStringUnknown({ alpha: FIRST })).toBe(true);
		expect(isRecordStringUnknown({ key: "value" })).toBe(true);
	});

	it("returns true for arrays (arrays are objects)", () => {
		expect(isRecordStringUnknown([])).toBe(true);
		expect(isRecordStringUnknown([FIRST, SECOND])).toBe(true);
	});

	it("returns false for null", () => {
		expect(isRecordStringUnknown(makeNull())).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isRecordStringUnknown(undefined)).toBe(false);
	});

	it("returns false for primitives", () => {
		expect(isRecordStringUnknown("str")).toBe(false);
		expect(isRecordStringUnknown(NUM_PRIMITIVE)).toBe(false);
		expect(isRecordStringUnknown(true)).toBe(false);
	});
});
