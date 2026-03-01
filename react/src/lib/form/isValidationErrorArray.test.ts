import { describe, expect, it } from "vitest";

import { type ValidationError } from "@/shared/validation/validate-types";

import isValidationErrorArray from "./isValidationErrorArray";

// The implementation is a simple runtime guard that checks for an array and
// then verifies each element looks like a ValidationError.  This suite covers
// positive and negative scenarios so the branch coverage of the helper stays
// high.

describe("isValidationErrorArray", () => {
	it("returns false for non-arrays", () => {
		expect(isValidationErrorArray(undefined)).toBe(false);
		const nullValue: unknown = JSON.parse("null");
		expect(isValidationErrorArray(nullValue)).toBe(false);
		const numValue = 123;
		expect(isValidationErrorArray(numValue as unknown)).toBe(false);
		expect(isValidationErrorArray("foo")).toBe(false);
		expect(isValidationErrorArray({})).toBe(false);
	});

	it("accepts an empty array", () => {
		// `every` vacuously true
		expect(isValidationErrorArray([])).toBe(true);
	});

	it("returns true for a valid array of ValidationError objects", () => {
		const errors: ValidationError[] = [
			{ field: "name", message: "required" },
			{ field: "age", message: "must be numeric" },
		];

		expect(isValidationErrorArray(errors)).toBe(true);
	});

	it("rejects when any item is not a plain record", () => {
		const values = [{ field: "x", message: "y" }, "not an object"];

		expect(isValidationErrorArray(values)).toBe(false);
	});

	it("rejects when a record is missing the field property", () => {
		const values = [{ message: "oops" }];
		expect(isValidationErrorArray(values)).toBe(false);
	});

	it("rejects when a record has wrong types for field or message", () => {
		const values1 = [{ field: 123, message: "bad" }];
		const values2 = [{ field: "f", message: 456 }];

		expect(isValidationErrorArray(values1)).toBe(false);
		expect(isValidationErrorArray(values2)).toBe(false);
	});

	it("ignores extra properties on the objects", () => {
		const values = [{ field: "ok", message: "whatever", extra: "ignored" } as unknown];

		expect(isValidationErrorArray(values)).toBe(true);
	});
});
