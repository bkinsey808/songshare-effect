import { describe, expect, it } from "vitest";

import clamp01 from "./clamp01";

const ZERO = 0;
const ONE = 1;
const HALF = 0.5;
const NEG_ONE = -1;
const NEG_SMALL = -0.001;
const SLIGHT_OVER = 1.001;
const TWO = 2;

describe("clamp01", () => {
	it("returns value when in [0, 1]", () => {
		expect(clamp01(ZERO)).toBe(ZERO);
		expect(clamp01(ONE)).toBe(ONE);
		expect(clamp01(HALF)).toBe(HALF);
	});

	it("clamps values below 0 to 0", () => {
		expect(clamp01(NEG_ONE)).toBe(ZERO);
		expect(clamp01(NEG_SMALL)).toBe(ZERO);
	});

	it("clamps values above 1 to 1", () => {
		expect(clamp01(SLIGHT_OVER)).toBe(ONE);
		expect(clamp01(TWO)).toBe(ONE);
	});

	it("treats NaN as 0", () => {
		expect(clamp01(Number.NaN)).toBe(ZERO);
	});
});
