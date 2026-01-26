import { describe, expect, it } from "vitest";

import type { SongPublic } from "../../song-schema";

import findMissingSongSlugs from "./findMissingSongSlugs";

/**
 * Build a minimal `SongPublic` payload for tests.
 *
 * Uses explicit `null` values for optional fields to keep the shape simple and
 * focused on `song_id` / `song_slug` which is relevant to these tests.
 *
 * @param slug - slug to use for both `song_id` and `song_slug`
 * @returns a `SongPublic` shaped object suitable for test assertions
 */
function makeSong(slug: string): SongPublic {
	/* eslint-disable unicorn/no-null */
	const song: SongPublic = {
		song_id: slug,
		song_name: "Hi",
		song_slug: slug,
		fields: ["lyrics"],
		slide_order: [],
		slides: {},
		key: null,
		scale: null,
		user_id: "u",
		short_credit: null,
		long_credit: null,
		public_notes: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
	/* eslint-enable unicorn/no-null */
	return song;
}

// Validate that active slugs are excluded and that when no active songs exist,
// all requested slugs are returned unchanged.
describe("findMissingSongSlugs", () => {
	// Ensures slugs already present in the activePublicSongIds are excluded.
	it("filters out slugs that are already active", () => {
		const songSlugs = ["s1", "s3"];
		const [, missingSlug] = songSlugs;
		const publicSongs = { s1: makeSong("s1"), s2: makeSong("s2") };
		const activePublicSongIds = [publicSongs.s1.song_id];
		const out = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds,
			publicSongs,
		});
		const expected = [missingSlug];
		expect(out).toStrictEqual(expected);
	});

	// When there are no active songs, the function should return all requested
	// slugs in their original ordering.
	it("returns all requested slugs when nothing active", () => {
		const songSlugs = ["a", "b"];
		const publicSongs = {};
		expect(findMissingSongSlugs({ songSlugs, activePublicSongIds: [], publicSongs })).toStrictEqual(
			songSlugs,
		);
	});

	// Defensive behavior: malformed or missing `publicSongs` entries should be
	// ignored rather than causing an exception or accidentally matching a slug.
	it("ignores malformed publicSongs entries", () => {
		// Allow `any` here to include malformed shapes intentionally used in this
		// test. This keeps the assertion local and avoids unsafe per-property
		// casts that trip the typechecker.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const publicSongs: any = {
			valid: makeSong("valid"),
			badUndefined: undefined,
			badType: { song_slug: 123 },
		};

		// Intentionally pass a malformed map here to ensure defensive behavior.
		// Allow this unsafe assignment for the purposes of the test — we want to
		// ensure the implementation safely ignores malformed values rather than
		// throwing. (This is test-only code.)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const songSlugs = ["valid", "maybe"];
		const [, missingSlug] = songSlugs;
		const out = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: ["valid", "badUndefined", "badType"],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			publicSongs,
		});

		expect(out).toStrictEqual([missingSlug]);
	});

	// Ensure duplicate active public song ids that map to the same slug are
	// deduplicated and the slug is still excluded from the result.
	it("deduplicates active slugs mapped from different ids", () => {
		const publicSongs = { a1: makeSong("dupe"), a2: makeSong("dupe") };
		const songSlugs = ["dupe", "other"];
		const [, missingSlug] = songSlugs;
		const out = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: ["a1", "a2"],
			publicSongs,
		});
		expect(out).toStrictEqual([missingSlug]);
	});
});
