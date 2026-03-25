import { describe, expect, it } from "vitest";

import isSupabaseClientLike from "./isSupabaseClientLike";

const WRONG_FROM_VALUE = 123;

describe("isSupabaseClientLike", () => {
	it("returns true for objects with a `from` function", () => {
		// Arrange
		const client = {
			from: (): { select: () => { in: () => { data: unknown[]; error: unknown } } } => ({
				select: (): { in: () => { data: unknown[]; error: unknown } } => ({
					in: (): { data: unknown[]; error: unknown } => ({ data: [], error: undefined }),
				}),
			}),
		} as unknown;

		// Act
		const result = isSupabaseClientLike(client);

		// Assert
		expect(result).toBe(true);
	});

	it("returns false when `from` is missing or not a function", () => {
		// Arrange
		const missing = undefined;
		const empty = {};
		const wrongFrom = { from: WRONG_FROM_VALUE };

		// Act
		const resMissing = isSupabaseClientLike(missing);
		const resEmpty = isSupabaseClientLike(empty);
		const resWrongFrom = isSupabaseClientLike(wrongFrom as unknown);

		// Assert
		expect(resMissing).toBe(false);
		expect(resEmpty).toBe(false);
		expect(resWrongFrom).toBe(false);
	});
});
