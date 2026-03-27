import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractValidationErrors from "./extractValidationErrors";
import INVALID_PRIMITIVE from "./extractValidationErrors.test-util";
import type { ValidationError } from "./validate-types";

const VALID_ERROR: ValidationError = { field: "name", message: "Required" };
const VALID_ERRORS: ValidationError[] = [VALID_ERROR];

describe("extractValidationErrors", () => {
	it("returns direct array when input is valid ValidationError[]", () => {
		// Arrange
		const input = VALID_ERRORS;

		// Act
		const result = extractValidationErrors(input);

		// Assert
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array for null and undefined", () => {
		// Act
		const r1 = extractValidationErrors(makeNull());
		const r2 = extractValidationErrors(undefined);

		// Assert
		expect(r1).toStrictEqual([]);
		expect(r2).toStrictEqual([]);
	});

	it("returns empty array for primitives", () => {
		// Act
		const r1 = extractValidationErrors(INVALID_PRIMITIVE);
		const r2 = extractValidationErrors("string");

		// Assert
		expect(r1).toStrictEqual([]);
		expect(r2).toStrictEqual([]);
	});

	it("returns empty array for array with invalid items", () => {
		// Act
		const r1 = extractValidationErrors([{ field: "x" }]);
		const r2 = extractValidationErrors([{ message: "only message" }]);
		const r3 = extractValidationErrors([{ field: 1, message: "m" }]);

		// Assert
		expect(r1).toStrictEqual([]);
		expect(r2).toStrictEqual([]);
		expect(r3).toStrictEqual([]);
	});

	it("extracts ValidationError[] from Error with JSON message", () => {
		// Arrange
		const err = new Error(JSON.stringify(VALID_ERRORS));

		// Act
		const result = extractValidationErrors(err);

		// Assert
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array when Error message is not valid JSON", () => {
		// Arrange
		const err = new Error("plain text");

		// Act
		const result = extractValidationErrors(err);

		// Assert
		expect(result).toStrictEqual([]);
	});

	it("extracts ValidationError[] from Error cause when message parse fails", () => {
		// Arrange
		const err = new Error("not json");
		Object.defineProperty(err, "cause", { value: VALID_ERRORS });

		// Act
		const result = extractValidationErrors(err);

		// Assert
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("extracts ValidationError[] from record with cause", () => {
		// Arrange
		const input = { cause: VALID_ERRORS };

		// Act
		const result = extractValidationErrors(input);

		// Assert
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("extracts ValidationError[] from record with JSON message", () => {
		// Arrange
		const input = { message: JSON.stringify(VALID_ERRORS) };

		// Act
		const result = extractValidationErrors(input);

		// Assert
		expect(result).toStrictEqual(VALID_ERRORS);
	});

	it("returns empty array for record with invalid message JSON", () => {
		// Arrange
		const input = { message: "not valid json" };

		// Act
		const result = extractValidationErrors(input);

		// Assert
		expect(result).toStrictEqual([]);
	});

	it("returns empty array for empty record", () => {
		// Act
		const result = extractValidationErrors({});

		// Assert
		expect(result).toStrictEqual([]);
	});
});
