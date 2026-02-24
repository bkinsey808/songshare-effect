import { describe, expect, it } from "vitest";

// import path doesn't need Supabase types; we only exercise generic map behavior.
import getGlobalClientCache from "./getGlobalClientCache";
import { clearGlobalCache, supabaseClientsValue } from "./getGlobalClientCache.test-util";

describe("getGlobalClientCache", () => {
	it("creates a new Map when none exists on globalThis", () => {
		clearGlobalCache();

		const cache = getGlobalClientCache();
		expect(cache).toBeInstanceOf(Map);

		// the returned map should be stored on globalThis under the symbol
		expect(supabaseClientsValue()).toBe(cache);
	});

	it("returns the same Map on subsequent calls", () => {
		clearGlobalCache();

		const first = getGlobalClientCache();
		const second = getGlobalClientCache();
		expect(second).toBe(first);

		// operations on the map should persist across calls
		// the map is typed to SupabaseClient, but we only care about generic Map behavior.
		// cast to a looser element type so we can insert an arbitrary sentinel without any lint complaints.
		const sentinel = { value: 42 };
		const genericFirst = first as Map<string, unknown>;
		genericFirst.set("foo", sentinel);
		const genericSecond = second as Map<string, unknown>;
		expect(genericSecond.get("foo")).toBe(sentinel);
	});

	it("creates a fresh Map if the previous one was removed", () => {
		clearGlobalCache();

		const original = getGlobalClientCache();
		// remove the reference again
		clearGlobalCache();
		const replacement = getGlobalClientCache();
		expect(replacement).not.toBe(original);
		// size should start empty
		const expectedSize = 0;
		expect(replacement.size).toBe(expectedSize);
	});
});
