/* oxlint-disable id-length, no-magic-numbers */
import { describe, expect, it } from "vitest";

import isSupabaseClientLike from "./isSupabaseClientLike";

describe("isSupabaseClientLike", () => {
	it("returns true for objects with a `from` function", () => {
		const client = {
			from: (): { select: () => { in: () => { data: unknown[]; error: unknown } } } => ({
				select: (): { in: () => { data: unknown[]; error: unknown } } => ({
					in: (): { data: unknown[]; error: unknown } => ({ data: [], error: undefined }),
				}),
			}),
		} as unknown;
		expect(isSupabaseClientLike(client)).toBe(true);
	});

	it("returns false when `from` is missing or not a function", () => {
		expect(isSupabaseClientLike(undefined)).toBe(false);
		expect(isSupabaseClientLike({})).toBe(false);
		expect(isSupabaseClientLike({ from: 123 })).toBe(false);
	});
});
