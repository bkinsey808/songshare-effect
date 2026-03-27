import { describe, expect, it } from "vitest";

import isRecord from "./isRecord";

const NOT_RECORD_PRIMITIVE = 42;
const NUM_ONE = 1;
const NUM_TWO = 2;
const NUM_THREE = 3;

describe("isRecord module shape diagnostics", () => {
	it("exports the default function", () => {
		// Sanity check - helpful for diagnosing module resolution issues
		expect(typeof isRecord).toBe("function");
	});
});

describe("isRecord behavior", () => {
	const truthyCases = [
		{ name: "empty object", value: {} },
		{ name: "object with key", value: { key: NUM_ONE } },
	] as const;

	it.each(truthyCases)("returns true for $name", ({ value }) => {
		// Act
		const result = isRecord(value);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [
		{ name: "array", value: [] },
		{ name: "tuple-like array", value: [NUM_ONE, NUM_TWO, NUM_THREE] },
		{ name: "undefined", value: undefined },
		{ name: "primitive number", value: NOT_RECORD_PRIMITIVE },
		{ name: "string", value: "hello" },
	] as const;

	it.each(falsyCases)("returns false for $name", ({ value }) => {
		// Act
		const result = isRecord(value as unknown);

		// Assert
		expect(result).toBe(false);
	});
});
