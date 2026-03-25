import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isString from "./isString";

const NUM_PRIMITIVE = 42;

describe("isString", () => {
	const truthyCases = [[""], ["hello"]] as const;

	it.each(truthyCases)("returns true for %s", (value) => {
		// Act
		const result = isString(value as unknown);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [[makeNull()], [undefined], [NUM_PRIMITIVE], [true], [{}], [[]]] as const;

	it.each(falsyCases)("returns false for %o", (value) => {
		// Act
		const result = isString(value as unknown);

		// Assert
		expect(result).toBe(false);
	});
});
