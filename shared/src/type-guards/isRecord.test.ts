/* oxlint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import isRecord from "./isRecord";

describe("isRecord module shape diagnostics", () => {
	it("exports the default function", () => {
		// Sanity check - helpful for diagnosing module resolution issues
		expect(typeof isRecord).toBe("function");
	});
});

describe("isRecord behavior", () => {
	it("returns true for plain objects", () => {
		expect(isRecord({})).toBe(true);
		expect(isRecord({ a: 1 })).toBe(true);
	});

	it("returns false for arrays (arrays are not treated as records)", () => {
		expect(isRecord([])).toBe(false);
		expect(isRecord([1, 2, 3])).toBe(false);
	});

	it("returns false for primitives and undefined", () => {
		expect(isRecord(undefined)).toBe(false);
		expect(isRecord(42)).toBe(false);
		expect(isRecord("hello")).toBe(false);
	});
});
