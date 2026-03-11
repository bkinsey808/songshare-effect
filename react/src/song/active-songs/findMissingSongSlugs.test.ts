import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";
import type { SongPublic } from "@/react/song/song-schema";

import findMissingSongSlugs from "./findMissingSongSlugs";

const SONG_A = makeSongPublic({ song_id: "id-a", song_slug: "slug-a" });
const SONG_B = makeSongPublic({ song_id: "id-b", song_slug: "slug-b" });
const SONG_C = makeSongPublic({ song_id: "id-c", song_slug: "slug-c" });
const PUBLIC_SONGS: Record<string, SongPublic> = {
	"id-a": SONG_A,
	"id-b": SONG_B,
	"id-c": SONG_C,
};

describe("findMissingSongSlugs", () => {
	it("returns all songSlugs when no active public songs", () => {
		const result = findMissingSongSlugs({
			songSlugs: ["slug-a", "slug-b"],
			activePublicSongIds: [],
			publicSongs: PUBLIC_SONGS,
		});
		expect(result).toStrictEqual(["slug-a", "slug-b"]);
	});

	it("returns empty when all songSlugs are active", () => {
		const result = findMissingSongSlugs({
			songSlugs: ["slug-a", "slug-b"],
			activePublicSongIds: ["id-a", "id-b"],
			publicSongs: PUBLIC_SONGS,
		});
		expect(result).toStrictEqual([]);
	});

	it("returns only slugs not in active set", () => {
		const result = findMissingSongSlugs({
			songSlugs: ["slug-a", "slug-b", "slug-c"],
			activePublicSongIds: ["id-a", "id-c"],
			publicSongs: PUBLIC_SONGS,
		});
		expect(result).toStrictEqual(["slug-b"]);
	});

	it("preserves original order of songSlugs", () => {
		const result = findMissingSongSlugs({
			songSlugs: ["slug-c", "slug-a", "slug-b"],
			activePublicSongIds: ["id-b"],
			publicSongs: PUBLIC_SONGS,
		});
		expect(result).toStrictEqual(["slug-c", "slug-a"]);
	});

	it("ignores active ids not present in publicSongs", () => {
		const result = findMissingSongSlugs({
			songSlugs: ["slug-a"],
			activePublicSongIds: ["id-nonexistent", "id-a"],
			publicSongs: PUBLIC_SONGS,
		});
		expect(result).toStrictEqual([]);
	});

	it("ignores publicSongs entries without song_slug string", () => {
		const malformed = forceCast<SongPublic>({ song_id: "id-d" });
		const songsWithMissingSlug = { ...PUBLIC_SONGS, "id-d": malformed };
		const result = findMissingSongSlugs({
			songSlugs: ["slug-a", "slug-d"],
			activePublicSongIds: ["id-d"],
			publicSongs: songsWithMissingSlug,
		});
		expect(result).toStrictEqual(["slug-a", "slug-d"]);
	});
});
