import { describe, expect, it } from "vitest";

import computeFieldsArray from "./computeFieldsArray";

describe("computeFieldsArray", () => {
	it("returns empty array for missing or malformed input", () => {
		expect(computeFieldsArray(undefined)).toStrictEqual([]);
		expect(computeFieldsArray({})).toStrictEqual([]);
		expect(computeFieldsArray({ fields: "no" })).toStrictEqual([]);
	});

	it("converts numbers to strings and keeps strings", () => {
		const NUM_TWO = 2;
		const pub: Record<string, unknown> = { fields: ["lyrics", NUM_TWO, true, undefined] };
		expect(computeFieldsArray(pub)).toStrictEqual(["lyrics", String(NUM_TWO)]);
	});
});
