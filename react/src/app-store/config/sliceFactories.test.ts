import { describe, expect, it } from "vitest";

import sliceFactories from "./sliceFactories";

const EXPECTED_SLICE_COUNT = 12;
const FIRST_INDEX = 0;

describe("sliceFactories", () => {
	it("exports a non-empty array of slice factory functions", () => {
		expect(Array.isArray(sliceFactories)).toBe(true);
		expect(sliceFactories).toHaveLength(EXPECTED_SLICE_COUNT);
	});

	it("each element is a function", () => {
		for (const factory of sliceFactories) {
			expect(typeof factory).toBe("function");
		}
	});

	it("first factory is callable", () => {
		const factory = sliceFactories[FIRST_INDEX];
		expect(factory).toBeDefined();
		expect(typeof factory).toBe("function");
	});
});
