/**
 * Minimal Vitest test template
 * Use this as a starting point for new unit tests in this repo.
 * - Arrange: create inputs/mocks
 * - Act: call the unit under test
 * - Assert: verify outputs/side-effects
 */

import { describe, expect, it } from "vitest";

/**
 * Add two numeric values.
 *
 * @param left - first addend
 * @param right - second addend
 * @returns - the sum of the two numbers
 */
function add(left: number, right: number): number {
	return left + right;
}

// Numeric constants used to avoid magic-number lint errors in examples
const TWO = 2;
const THREE = 3;
const FIVE = 5;
const NEG_ONE = -1;
const NEG_TWO = -2;
const NEG_THREE = -3;

describe("add util", () => {
	it("adds numbers correctly", () => {
		expect(add(TWO, THREE)).toBe(FIVE);
	});

	it("handles negative numbers", () => {
		expect(add(NEG_ONE, NEG_TWO)).toBe(NEG_THREE);
	});
});
