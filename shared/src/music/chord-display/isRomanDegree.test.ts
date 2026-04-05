import { describe, expect, it } from "vitest";

import isRomanDegree from "./isRomanDegree";

describe("isRomanDegree", () => {
	it("returns true for supported roman roots", () => {
		// Act
		const result = isRomanDegree("bVII");

		// Assert
		expect(result).toBe(true);
	});

	it("returns false for note names", () => {
		// Act
		const result = isRomanDegree("C");

		// Assert
		expect(result).toBe(false);
	});
});
