import { describe, expect, it } from "vitest";

import smoothValue from "./smoothValue";

const ZERO = 0;
const ONE = 1;

describe("smoothValue", () => {
	const PREVIOUS = 10;
	const NEXT = 20;
	const ALPHA_HALF = 0.5;
	const EXPECTED_HALF = 15;
	const TWO = 2;
	const MINUS_ONE = -1;

	it("interpolates correctly with alpha 0.5", () => {
		expect(smoothValue(PREVIOUS, NEXT, ALPHA_HALF)).toBe(EXPECTED_HALF);
	});

	it("returns previous value if alpha is 0", () => {
		expect(smoothValue(PREVIOUS, NEXT, ZERO)).toBe(PREVIOUS);
	});

	it("returns next value if alpha is 1", () => {
		expect(smoothValue(PREVIOUS, NEXT, ONE)).toBe(NEXT);
	});

	it("clamps alpha > 1 to 1 (returns next)", () => {
		expect(smoothValue(PREVIOUS, NEXT, TWO)).toBe(NEXT);
	});

	it("clamps alpha < 0 to 0 (returns previous)", () => {
		expect(smoothValue(PREVIOUS, NEXT, MINUS_ONE)).toBe(PREVIOUS);
	});
});
