import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isString from "./isString";

const NUM_PRIMITIVE = 42;

describe("isString", () => {
	const truthyCases = [
		{ name: "empty string", value: "" },
		{ name: "hello string", value: "hello" },
	] as const;

	it.each(truthyCases)("returns true for $name", ({ value }) => {
		// Act
		const result = isString(value as unknown);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [
		{ name: "null-like", value: makeNull() },
		{ name: "undefined", value: undefined },
		{ name: "number", value: NUM_PRIMITIVE },
		{ name: "boolean true", value: true },
		{ name: "object", value: {} },
		{ name: "array", value: [] },
	] as const;

	it.each(falsyCases)("returns false for $name", ({ value }) => {
		// Act
		const result = isString(value as unknown);

		// Assert
		expect(result).toBe(false);
	});
});
