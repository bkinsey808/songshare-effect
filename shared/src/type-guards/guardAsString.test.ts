import { describe, expect, it } from "vitest";

import guardAsString from "./guardAsString";

describe("guardAsString", () => {
	const NOT_STRING = 123;

	const cases: readonly [unknown, string][] = [
		["ok", "ok"],
		[NOT_STRING, ""],
	];

	it.each(cases)("guardAsString(%o) => %s", (value, expected) => {
		// Act
		const res = guardAsString(value);

		// Assert
		expect(res).toBe(expected);
	});

	it("falls back to provided default when not a string", () => {
		// Act
		const resFallback = guardAsString(undefined, "fallback");

		// Assert
		expect(resFallback).toBe("fallback");
	});
});
