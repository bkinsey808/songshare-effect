import { describe, expect, it } from "vitest";

import clamp01 from "./clamp01";

const ZERO = 0;
const ONE = 1;
const HALF = 0.5;
const TWO = 2;
const MINUS_ONE = -1;

describe("clamp01", () => {
	it("returns value if within [0, 1]", () => {
		expect(clamp01(HALF)).toBe(HALF);
		expect(clamp01(ZERO)).toBe(ZERO);
		expect(clamp01(ONE)).toBe(ONE);
	});

	it("clamps values greater than 1 to 1", () => {
		expect(clamp01(TWO)).toBe(ONE);
	});

	it("clamps values less than 0 to 0", () => {
		expect(clamp01(MINUS_ONE)).toBe(ZERO);
	});

	it("returns 0 for NaN", () => {
		expect(clamp01(Number.NaN)).toBe(ZERO);
	});
});
