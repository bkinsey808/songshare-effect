import { describe, expect, it } from "vitest";

import guardAsString from "./guardAsString";

describe("guardAsString", () => {
	const NOT_STRING = 123;

	const cases: readonly { name: string; value: unknown; expected: string }[] = [
		{ name: "valid string", value: "ok", expected: "ok" },
		{ name: "non-string input", value: NOT_STRING, expected: "" },
	];

	it.each(cases)("guardAsString: $name", ({ value, expected }) => {
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
