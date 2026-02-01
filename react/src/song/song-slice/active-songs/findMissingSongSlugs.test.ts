import { describe, expect, it } from "vitest";

import type { SongPublic } from "@/react/song/song-schema";

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
import makeMalformedPublicSongs from "@/react/test-utils/makeMalformedPublicSongs";
import makeSongPublic from "@/react/test-utils/makeSongPublic";

function makeSong(slug: string): SongPublic {
	return makeSongPublic({
		song_id: slug,
		song_slug: slug,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	});
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
		// Use a helper that centralizes the test-only malformed fixture and its
		// narrow type assertion so individual tests stay lint-clean.
		const publicSongs = makeMalformedPublicSongs();

		const songSlugs = ["valid", "maybe"];
		const [, missingSlug] = songSlugs;
		const out = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: ["valid", "badUndefined", "badType"],
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
