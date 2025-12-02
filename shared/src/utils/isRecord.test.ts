import { describe, it, expect } from "vitest";

import isRecord from "./isRecord";

describe("isRecord", () => {
	it("returns true for plain objects", () => {
		expect(isRecord({})).toBe(true);
		// oxlint-disable-next-line id-length
		expect(isRecord({ a: 1 })).toBe(true);
		expect(isRecord(Object.create(null))).toBe(true);
	});

	it("returns false for arrays, null, primitives, and functions", () => {
		// oxlint-disable-next-line no-null
		expect(isRecord(null)).toBe(false);
		expect(isRecord([])).toBe(false);
		// oxlint-disable-next-line no-magic-numbers
		expect(isRecord(123)).toBe(false);
		expect(isRecord("a")).toBe(false);
		// Use an explicit return to avoid an empty-function lint error
		expect(isRecord(() => undefined)).toBe(false);
	});
});
