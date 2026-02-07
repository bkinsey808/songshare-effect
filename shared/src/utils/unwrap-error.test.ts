import { describe, expect, it } from "vitest";

import { findInnerError, unwrapError } from "./unwrap-error";

describe("findInnerError", () => {
	it("returns undefined for primitives", () => {
		const NUMBER_VAL = 1;
		expect(findInnerError("str")).toBeUndefined();
		expect(findInnerError(NUMBER_VAL)).toBeUndefined();
		expect(findInnerError(undefined)).toBeUndefined();
	});

	it("finds deeply nested Error", () => {
		const payload = { level1: { level2: { level3: new Error("boom") } } };
		expect(findInnerError(payload)).toBeInstanceOf(Error);
	});

	it("returns undefined when no Error found", () => {
		const payload = { level1: { level2: { level3: { value: 1 } } } };
		expect(findInnerError(payload)).toBeUndefined();
	});
});

describe("unwrapError", () => {
	it("unwraps cause/error/failure.cause shapes", () => {
		expect(unwrapError({ cause: new Error("cause") })).toBeInstanceOf(Error);
		expect(unwrapError({ error: new Error("error") })).toBeInstanceOf(Error);
		expect(unwrapError({ failure: { cause: new Error("f") } })).toBeInstanceOf(Error);
	});

	it("returns non-object unchanged", () => {
		const valueString = "nope";
		expect(unwrapError(valueString)).toBe(valueString);
	});
});
