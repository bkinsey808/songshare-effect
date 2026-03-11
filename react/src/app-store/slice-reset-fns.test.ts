import { describe, expect, it, vi } from "vitest";

import { ONE } from "@/shared/constants/shared-constants";

import { resetAllSlices, sliceResetFns } from "./slice-reset-fns";

describe("slice-reset-fns", () => {
	it("sliceResetFns is a Set", () => {
		expect(sliceResetFns).toBeInstanceOf(Set);
	});

	it("resetAllSlices invokes all registered functions", () => {
		const fn1 = vi.fn();
		const fn2 = vi.fn();
		sliceResetFns.add(fn1);
		sliceResetFns.add(fn2);

		resetAllSlices();

		expect(fn1).toHaveBeenCalledTimes(ONE);
		expect(fn2).toHaveBeenCalledTimes(ONE);

		sliceResetFns.delete(fn1);
		sliceResetFns.delete(fn2);
	});

	it("resetAllSlices runs when Set is empty", () => {
		expect(() => {
			resetAllSlices();
		}).not.toThrow();
	});
});
