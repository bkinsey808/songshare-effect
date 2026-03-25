import { describe, expect, it } from "vitest";

import findInnerError from "./findInnerError";

describe("findInnerError", () => {
	const NUMBER_VAL = 1;
	const undefinedCases: [unknown][] = [["str"], [NUMBER_VAL], [undefined]];

	it.each(undefinedCases)("returns undefined for %s", (input) => {
		// Act
		const got = findInnerError(input);

		// Assert
		expect(got).toBeUndefined();
	});

	it("returns the same Error when passed an Error instance", () => {
		// Arrange
		const err = new Error("boom");

		// Act
		const got = findInnerError(err);

		// Assert
		expect(got).toBe(err);
	});

	it("finds deeply nested Error within default depth", () => {
		// Arrange
		const payload = { level1: { level2: { level3: new Error("deep") } } };

		// Act
		const got = findInnerError(payload);

		// Assert
		expect(got).toBeInstanceOf(Error);
	});

	it("returns undefined when Error is deeper than default depth", () => {
		// Arrange
		const payload = { l1: { l2: { l3: { l4: new Error("too deep") } } } };

		// Act
		const got = findInnerError(payload);

		// Assert
		expect(got).toBeUndefined();
	});

	it("handles circular structures without throwing and returns undefined", () => {
		// Arrange
		const circular: Record<string, unknown> = {};
		circular["self"] = circular;

		// Act
		const got = findInnerError(circular);

		// Assert
		expect(got).toBeUndefined();
	});
});
