import { describe, expect, it } from "vitest";

import smoothValue from "./smoothValue";

const PREV = 10;
const NEXT = 20;
const ALPHA_ZERO = 0;
const ALPHA_ONE = 1;
const ALPHA_HALF = 0.5;
const LO = 0;
const HI = 10;
const MID = 5;
const PREV2 = 10;
const NEXT2 = 30;
const MID2 = 20;
const ALPHA_OVER = 1.5;
const ALPHA_UNDER = -0.5;

describe("smoothValue", () => {
	it("returns previous when alpha is 0", () => {
		expect(smoothValue(PREV, NEXT, ALPHA_ZERO)).toBe(PREV);
	});

	it("returns next when alpha is 1", () => {
		expect(smoothValue(PREV, NEXT, ALPHA_ONE)).toBe(NEXT);
	});

	it("returns midpoint when alpha is 0.5", () => {
		expect(smoothValue(LO, HI, ALPHA_HALF)).toBe(MID);
		expect(smoothValue(PREV2, NEXT2, ALPHA_HALF)).toBe(MID2);
	});

	it("clamps alpha to [0, 1] and applies formula", () => {
		expect(smoothValue(LO, HI, ALPHA_OVER)).toBe(HI);
		expect(smoothValue(LO, HI, ALPHA_UNDER)).toBe(LO);
	});
});
