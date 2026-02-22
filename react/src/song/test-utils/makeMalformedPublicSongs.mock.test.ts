import { describe, expect, it } from "vitest";

import makeMalformedPublicSongs from "./makeMalformedPublicSongs.mock";

// The helper lives in test-utils and is itself used by many other tests. The
// goal of this spec is simply to ensure the returned fixture contains the
// expected set of keys and retains its intentionally malformed entries. This
// gives us a safety net if the factory is ever refactored or accidentally
// truncated and also improves overall coverage.

describe("makeMalformedPublicSongs", () => {
	it("produces a record with the expected top-level keys and a valid entry", () => {
		const out = makeMalformedPublicSongs();

		// keys are part of the contract consumed by callers
		expect(Object.keys(out)).toStrictEqual(["valid", "badUndefined", "badType"]);

		// `valid` entry should look like a proper SongPublic object and include
		// reasonable timestamps. We'll use a tiny type guard so that the later
		// asserts operate on a non-null variable without any eslint disables.
		function assertDefined<TValue>(val: TValue | undefined): asserts val is TValue {
			expect(val).toBeDefined();
		}

		const good = out["valid"];
		assertDefined(good);

		expect(good).toMatchObject({
			song_id: "valid",
			song_slug: "valid",
		});
		expect(typeof good.created_at).toBe("string");
		expect(typeof good.updated_at).toBe("string");
	});

	it("retains malformed entries so callers can test defensive code", () => {
		const out = makeMalformedPublicSongs();
		// both malformed variants should remain intact
		expect(out["badUndefined"]).toBeUndefined();
		expect(out["badType"]).toStrictEqual({ song_slug: 123 });
	});
});
