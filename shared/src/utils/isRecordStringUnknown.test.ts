import { describe, expect, it } from "vitest";

import isRecordStringUnknown from "./isRecordStringUnknown";

describe("isRecordStringUnknown", () => {
	it("returns true for plain objects", () => {
		expect(isRecordStringUnknown({})).toBe(true);
	});

	it("returns true for arrays (typeof object) and false for undefined", () => {
		expect(isRecordStringUnknown([])).toBe(true);
		expect(isRecordStringUnknown(undefined)).toBe(false);
	});

	it("returns false for primitives", () => {
		const NUM = 1;
		expect(isRecordStringUnknown("s")).toBe(false);
		expect(isRecordStringUnknown(NUM)).toBe(false);
	});
});
