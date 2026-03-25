import { describe, expect, it } from "vitest";

import toError from "./toError";

describe("toError", () => {
	it("returns same Error instance when passed an Error", () => {
		// Arrange
		const orig = new Error("boom");

		// Act
		const got = toError(orig);

		// Assert
		expect(got).toBe(orig);
	});

	it("converts string to Error and preserves cause", () => {
		// Arrange
		const cause = { name: "cause" };
		const input = "simple message";

		// Act
		const err = toError(input, cause);

		// Assert
		expect(err.message).toBe(input);
		expect(err.cause).toBe(cause);
	});

	it("stringifies object input and preserves cause", () => {
		// Arrange
		const obj = { first: 1, second: "x" };
		const cause = "orig";

		// Act
		const err = toError(obj, cause);

		// Assert
		expect(err.message).toBe(JSON.stringify(obj));
		expect(err.cause).toBe(cause);
	});

	it("falls back to String(value) when JSON.stringify throws", () => {
		// Arrange
		type Circular = { self?: Circular; toString?: () => string };
		const circular: Circular = { toString: () => "circular" } as Circular;
		circular.self = circular; // causes JSON.stringify to throw

		// Act
		const err = toError(circular, "c");

		// Assert
		expect(err.message).toBe(String(circular));
		expect(err.cause).toBe("c");
	});
});
