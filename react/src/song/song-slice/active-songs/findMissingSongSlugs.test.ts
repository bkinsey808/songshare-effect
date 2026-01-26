import { describe, expect, it } from "vitest";

import type { SongPublic } from "../../song-schema";

import findMissingSongSlugs from "./findMissingSongSlugs";

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

describe("findMissingSongSlugs", () => {
	it("filters out slugs that are already active", () => {
		const publicSongs = { s1: makeSong("s1"), s2: makeSong("s2") };
		const out = findMissingSongSlugs({
			songSlugs: ["s1", "s3"],
			activePublicSongIds: ["s1"],
			publicSongs,
		});
		expect(out).toStrictEqual(["s3"]);
	});

	it("returns all requested slugs when nothing active", () => {
		const publicSongs = {};
		expect(
			findMissingSongSlugs({ songSlugs: ["a", "b"], activePublicSongIds: [], publicSongs }),
		).toStrictEqual(["a", "b"]);
	});
});
