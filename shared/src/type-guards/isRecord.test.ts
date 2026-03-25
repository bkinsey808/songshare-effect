import { describe, expect, it } from "vitest";

import isRecord from "./isRecord";

const NOT_RECORD_PRIMITIVE = 42;
const NUM_ONE = 1;
const NUM_TWO = 2;
const NUM_THREE = 3;

describe("isRecord module shape diagnostics", () => {
	it("exports the default function", () => {
		// Sanity check - helpful for diagnosing module resolution issues
		expect(typeof isRecord).toBe("function");
	});
});

describe("isRecord behavior", () => {
	const truthyCases = [[{}], [{ key: NUM_ONE }]] as const;

	it.each(truthyCases)("returns true for %o", (value) => {
		// Act
		const result = isRecord(value);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [
		[[]],
		[[NUM_ONE, NUM_TWO, NUM_THREE]],
		[undefined],
		[NOT_RECORD_PRIMITIVE],
		["hello"],
	] as const;

	it.each(falsyCases)("returns false for %o", (value) => {
		// Act
		const result = isRecord(value);

		// Assert
		expect(result).toBe(false);
	});
});
