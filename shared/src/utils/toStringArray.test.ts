import { describe, expect, it } from "vitest";

import toStringArray from "./toStringArray";

const FIRST_NUM = 1;

describe("toStringArray", () => {
	it("converts array items to strings", () => {
		// Arrange
		const input = [FIRST_NUM, true, "a"] as const;

		// Act
		const result = toStringArray(input);

		// Assert
		expect(result).toStrictEqual(["1", "true", "a"]);
	});

	it("returns empty array for non-arrays", () => {
		// Act
		const result = toStringArray("nope");

		// Assert
		expect(result).toStrictEqual([]);
	});

	it("produces a mutable string array and coerces values from readonly input", () => {
		// Arrange
		const readonlyInput = [undefined, undefined] as const;

		// Act
		const out = toStringArray(readonlyInput);

		// Assert: coerced values and mutability
		expect(out).toStrictEqual(["undefined", "undefined"]);
		out.push("added");
		expect(out).toContain("added");
	});
});
