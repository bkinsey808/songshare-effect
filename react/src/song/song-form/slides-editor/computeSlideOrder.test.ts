import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import computeSlideOrder from "./computeSlideOrder";

describe("computeSlideOrder", () => {
	it("returns empty array when pub is undefined", () => {
		expect(computeSlideOrder(undefined)).toStrictEqual([]);
	});

	it("returns empty array when slide_order is not an array", () => {
		expect(computeSlideOrder({ slide_order: "not-array" })).toStrictEqual([]);
		expect(computeSlideOrder({ slide_order: makeNull() })).toStrictEqual([]);
	});

	it("coerces string and number items to strings", () => {
		const pub = { slide_order: ["a", "b", "c"] };
		expect(computeSlideOrder(pub)).toStrictEqual(["a", "b", "c"]);
	});

	it("coerces numeric items to strings", () => {
		const ONE = 1;
		const TWO = 2;
		const THREE = 3;
		const pub = { slide_order: [ONE, TWO, THREE] };
		expect(computeSlideOrder(pub)).toStrictEqual(["1", "2", "3"]);
	});

	it("skips non-string and non-number items", () => {
		const NUM_TWO = 2;
		const pub = { slide_order: ["a", makeNull(), NUM_TWO, {}, undefined, "c"] };
		expect(computeSlideOrder(pub)).toStrictEqual(["a", "2", "c"]);
	});

	it("returns empty array when slide_order is empty array", () => {
		expect(computeSlideOrder({ slide_order: [] })).toStrictEqual([]);
	});
});
