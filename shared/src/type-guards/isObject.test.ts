import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isObject from "./isObject";

const NUM_PRIMITIVE = 42;
const ONE = 1;

function fn(): number {
	return ONE;
}

describe("isObject module shape diagnostics", () => {
	it("exports the default function", () => {
		expect(typeof isObject).toBe("function");
	});
});

describe("isObject behavior", () => {
	const truthyCases = [
		{ name: "plain object", value: { key: NUM_PRIMITIVE } },
		{ name: "empty array instance", value: [] },
		{ name: "date instance", value: new Date() },
	] as const;

	it.each(truthyCases)("returns true for $name", ({ value }) => {
		// Act
		const result = isObject(value);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [
		{ name: "null-like", value: makeNull() },
		{ name: "number primitive", value: NUM_PRIMITIVE },
		{ name: "function", value: fn },
		{ name: "undefined", value: undefined },
	] as const;

	it.each(falsyCases)("returns false for $name", ({ value }) => {
		// Act
		const result = isObject(value as unknown);

		// Assert
		expect(result).toBe(false);
	});
});
