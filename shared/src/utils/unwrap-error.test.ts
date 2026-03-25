import { describe, expect, it } from "vitest";

import findInnerError from "./findInnerError";
import unwrapError from "./unwrap-error";

describe("findInnerError", () => {
	it("returns undefined for primitives", () => {
		// Arrange
		const NUMBER_VAL = 1;

		// Act & Assert
		expect(findInnerError("str")).toBeUndefined();
		expect(findInnerError(NUMBER_VAL)).toBeUndefined();
		expect(findInnerError(undefined)).toBeUndefined();
	});

	it("finds deeply nested Error", () => {
		// Arrange
		const payload = { level1: { level2: { level3: new Error("boom") } } };

		// Act
		const got = findInnerError(payload);

		// Assert
		expect(got).toBeInstanceOf(Error);
	});

	it("returns undefined when no Error found", () => {
		// Arrange
		const payload = { level1: { level2: { level3: { value: 1 } } } };

		// Act & Assert
		expect(findInnerError(payload)).toBeUndefined();
	});
});

describe("unwrapError", () => {
	it("unwraps cause/error/failure.cause shapes", () => {
		// Act & Assert
		expect(unwrapError({ cause: new Error("cause") })).toBeInstanceOf(Error);
		expect(unwrapError({ error: new Error("error") })).toBeInstanceOf(Error);
		expect(unwrapError({ failure: { cause: new Error("f") } })).toBeInstanceOf(Error);
	});

	it("returns non-object unchanged", () => {
		// Arrange
		const valueString = "nope";

		// Act & Assert
		expect(unwrapError(valueString)).toBe(valueString);
	});
});
