import type { SongPublic } from "@/react/song/song-schema";

/**
 * Helper to create a minimal SongPublic for testing.
 */
export function makeTestSong(overrides: Partial<SongPublic> = {}): SongPublic {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return {
		song_id: "s1",
		song_name: "Test Song",
		song_slug: "test-song",
		user_id: "u1",
		fields: [],
		slide_order: [],
		slides: {},
		/* eslint-disable unicorn/no-null */
		key: null as string | null,
		scale: null as string | null,
		short_credit: null as string | null,
		long_credit: null as string | null,
		public_notes: null as string | null,
		/* eslint-enable unicorn/no-null */
		created_at: "2026-02-07T00:00:00Z",
		updated_at: "2026-02-07T00:00:00Z",
		...overrides,
	} as unknown as SongPublic;
}

/**
 * Helper for testing malformed song data with missing name.
 */
export function makeSongWithUndefinedName(overrides: Partial<SongPublic> = {}): SongPublic {
	return makeTestSong({
		...overrides,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		song_name: undefined as unknown as string,
	});
}
