/* oxlint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import isStringArray from "./isStringArray";

describe("isStringArray", () => {
	it("returns true for arrays of strings", () => {
		expect(isStringArray(["a", "b"])).toBe(true);
	});

	it("returns false for non-arrays or arrays with non-strings", () => {
		expect(isStringArray("not an array")).toBe(false);
		const numericArray = [1, 2, 3];
		expect(isStringArray(numericArray)).toBe(false);
	});

	it("handles empty arrays", () => {
		expect(isStringArray([])).toBe(true);
	});
});
