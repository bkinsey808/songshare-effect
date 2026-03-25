import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isObject from "./isObject";

const NUM_PRIMITIVE = 42;
const ONE = 1;

function fn(): number {
	return ONE;
}

describe("isObject module shape diagnostics", () => {
	it("exports the default function", () => {
		expect(typeof isObject).toBe("function");
	});
});

describe("isObject behavior", () => {
	const truthyCases = [[{ key: NUM_PRIMITIVE }], [[]], [new Date()]] as const;

	it.each(truthyCases)("returns true for %o", (value) => {
		// Act
		const result = isObject(value);

		// Assert
		expect(result).toBe(true);
	});

	const falsyCases = [[makeNull()], [NUM_PRIMITIVE], [fn], [undefined]] as const;

	it.each(falsyCases)("returns false for %o", (value) => {
		// Act
		const result = isObject(value as unknown);

		// Assert
		expect(result).toBe(false);
	});
});
