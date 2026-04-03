import { describe, expect, it } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import normalizeNullsTopLevel from "./normalizeNullsTopLevel";

const PRIMITIVE_NUMBER = 42;
const FIRST_INDEX = 0;
const SECOND_INDEX = 1;

describe("normalizeNullsTopLevel", () => {
	it("converts null to undefined", () => {
		expect(normalizeNullsTopLevel(makeNull())).toBeUndefined();
	});

	it("leaves undefined unchanged", () => {
		expect(normalizeNullsTopLevel(undefined)).toBeUndefined();
	});

	it("leaves primitives unchanged", () => {
		expect(normalizeNullsTopLevel(PRIMITIVE_NUMBER)).toBe(PRIMITIVE_NUMBER);
		expect(normalizeNullsTopLevel("hello")).toBe("hello");
		expect(normalizeNullsTopLevel(true)).toBe(true);
	});

	it("converts null values inside objects to undefined", () => {
		const keyAlpha = "alpha";
		const keyBeta = "beta";
		const input = { [keyAlpha]: makeNull(), [keyBeta]: "ok" };
		const result = forceCast<Record<string, unknown>>(normalizeNullsTopLevel(input));
		expect(result[keyAlpha]).toBeUndefined();
		expect(result[keyBeta]).toBe("ok");
	});

	it("converts null values inside arrays to undefined", () => {
		const input = [makeNull(), "x"];
		const result = forceCast<unknown[]>(normalizeNullsTopLevel(input));
		expect(result[FIRST_INDEX]).toBeUndefined();
		expect(result[SECOND_INDEX]).toBe("x");
	});

	it("recurses into nested objects and arrays", () => {
		const input = { arr: [makeNull(), { nested: makeNull() }] };
		const result = forceCast<Record<string, unknown>>(normalizeNullsTopLevel(input));
		const arr = forceCast<unknown[]>(result.arr);
		expect(arr[FIRST_INDEX]).toBeUndefined();
		expect(forceCast<Record<string, unknown>>(arr[SECOND_INDEX]).nested).toBeUndefined();
	});

	it("does not mutate the input", () => {
		const keyX = "keyX";
		const inner = { [keyX]: makeNull() };
		const input = { nested: inner };
		normalizeNullsTopLevel(input);
		expect(inner[keyX]).toBeNull();
	});
});
