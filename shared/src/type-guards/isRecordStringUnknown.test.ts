import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isRecordStringUnknown from "./isRecordStringUnknown";

const FIRST = 1;
const SECOND = 2;
const NUM_PRIMITIVE = 42;

describe("isRecordStringUnknown", () => {
	it("returns true for plain objects", () => {
		// Arrange
		const empty = {};
		const withNumber = { alpha: FIRST };
		const withString = { key: "value" };

		// Act
		const emptyGot = isRecordStringUnknown(empty);
		const withNumberGot = isRecordStringUnknown(withNumber);
		const withStringGot = isRecordStringUnknown(withString);

		// Assert
		expect(emptyGot).toBe(true);
		expect(withNumberGot).toBe(true);
		expect(withStringGot).toBe(true);
	});

	it("returns true for arrays (arrays are objects)", () => {
		// Arrange
		const emptyArray: unknown[] = [];
		const numbered = [FIRST, SECOND];

		// Act
		const emptyArrayGot = isRecordStringUnknown(emptyArray);
		const numberedGot = isRecordStringUnknown(numbered);

		// Assert
		expect(emptyArrayGot).toBe(true);
		expect(numberedGot).toBe(true);
	});

	it("returns false for null", () => {
		// Arrange
		const nullValue = makeNull();

		// Act
		const got = isRecordStringUnknown(nullValue);

		// Assert
		expect(got).toBe(false);
	});

	it("returns false for undefined", () => {
		// Arrange
		const undefinedValue = undefined;

		// Act
		const got = isRecordStringUnknown(undefinedValue);

		// Assert
		expect(got).toBe(false);
	});

	it("returns false for primitives", () => {
		// Arrange
		const strValue = "str";
		const numberValue = NUM_PRIMITIVE;
		const boolValue = true;

		// Act
		const strGot = isRecordStringUnknown(strValue);
		const numberGot = isRecordStringUnknown(numberValue);
		const boolGot = isRecordStringUnknown(boolValue);

		// Assert
		expect(strGot).toBe(false);
		expect(numberGot).toBe(false);
		expect(boolGot).toBe(false);
	});
});
