import { describe, expect, it } from "vitest";

import isSupabaseClientLike from "./isSupabaseClientLike";

const WRONG_FROM_VALUE = 123;

describe("isSupabaseClientLike", () => {
	const truthyCases = [
		{
			name: "object with from function",
			value: {
				from: (): { select: () => { in: () => { data: unknown[]; error: unknown } } } => ({
					select: (): { in: () => { data: unknown[]; error: unknown } } => ({
						in: (): { data: unknown[]; error: unknown } => ({ data: [], error: undefined }),
					}),
				}),
			} as unknown,
		},
	];

	it.each(truthyCases)("returns true for $name", ({ value }: { value: unknown }) => {
		expect(isSupabaseClientLike(value)).toBe(true);
	});

	const falsyCases = [
		{ name: "missing", value: undefined },
		{ name: "empty object", value: {} },
		{ name: "wrong from type", value: { from: WRONG_FROM_VALUE } as unknown },
	];

	it.each(falsyCases)("returns false for $name", ({ value }: { value: unknown }) => {
		expect(isSupabaseClientLike(value)).toBe(false);
	});
});
