import { describe, expect, it } from "vitest";

import computeSlideOrder from "./computeSlideOrder";

describe("computeSlideOrder", () => {
	it("returns empty array for missing/malformed input", () => {
		expect(computeSlideOrder(undefined)).toStrictEqual([]);
		expect(computeSlideOrder({})).toStrictEqual([]);
		expect(computeSlideOrder({ slide_order: "no" })).toStrictEqual([]);
	});

	it("converts numbers to strings and ignores invalid items", () => {
		const NUM_TWO = 2;
		const input: Record<string, unknown> = {
			slide_order: ["a", NUM_TWO, true, undefined, { something: 1 }],
		};
		expect(computeSlideOrder(input)).toStrictEqual(["a", String(NUM_TWO)]);
	});
});
