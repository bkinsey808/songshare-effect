import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractValidationErrors from "./extractValidationErrors";
import INVALID_PRIMITIVE from "./extractValidationErrors.test-util";
import type { ValidationError } from "./validate-types";

const VALID_ERROR: ValidationError = { field: "name", message: "Required" };
const VALID_ERRORS: ValidationError[] = [VALID_ERROR];

describe("extractValidationErrors", () => {
	it("returns direct array when input is valid ValidationError[]", () => {
		const result = extractValidationErrors(VALID_ERRORS);
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array for null and undefined", () => {
		expect(extractValidationErrors(makeNull())).toStrictEqual([]);
		expect(extractValidationErrors(undefined)).toStrictEqual([]);
	});

	it("returns empty array for primitives", () => {
		expect(extractValidationErrors(INVALID_PRIMITIVE)).toStrictEqual([]);
		expect(extractValidationErrors("string")).toStrictEqual([]);
	});

	it("returns empty array for array with invalid items", () => {
		expect(extractValidationErrors([{ field: "x" }])).toStrictEqual([]);
		expect(extractValidationErrors([{ message: "only message" }])).toStrictEqual([]);
		expect(extractValidationErrors([{ field: 1, message: "m" }])).toStrictEqual([]);
	});

	it("extracts ValidationError[] from Error with JSON message", () => {
		const err = new Error(JSON.stringify(VALID_ERRORS));
		const result = extractValidationErrors(err);
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array when Error message is not valid JSON", () => {
		const err = new Error("plain text");
		const result = extractValidationErrors(err);
		expect(result).toStrictEqual([]);
	});

	it("extracts ValidationError[] from Error cause when message parse fails", () => {
		const err = new Error("not json");
		Object.defineProperty(err, "cause", { value: VALID_ERRORS });
		const result = extractValidationErrors(err);
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("extracts ValidationError[] from record with cause", () => {
		const input = { cause: VALID_ERRORS };
		const result = extractValidationErrors(input);
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("extracts ValidationError[] from record with JSON message", () => {
		const input = { message: JSON.stringify(VALID_ERRORS) };
		const result = extractValidationErrors(input);
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array for record with invalid message JSON", () => {
		const input = { message: "not valid json" };
		const result = extractValidationErrors(input);
		expect(result).toStrictEqual([]);
	});

	it("returns empty array for empty record", () => {
		expect(extractValidationErrors({})).toStrictEqual([]);
	});
});
