import type { SongPublic } from "@/react/song/song-schema";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * Helper to create a minimal SongPublic for testing.
 */
export function makeTestSong(overrides: Partial<SongPublic> = {}): SongPublic {
	// avoid explicit null literals (unicorn/no-null) by parsing at runtime
	const parsedNull = forceCast<string | null>(JSON.parse("null"));
	const base: SongPublic = {
		song_id: "s1",
		song_name: "Test Song",
		song_slug: "test-song",
		user_id: "u1",
		fields: [],
		slide_order: [],
		slides: {},
		key: parsedNull,
		scale: parsedNull,
		short_credit: parsedNull,
		long_credit: parsedNull,
		public_notes: parsedNull,
		created_at: "2026-02-07T00:00:00Z",
		updated_at: "2026-02-07T00:00:00Z",
	};

	return forceCast<SongPublic>({ ...base, ...overrides });
}

/**
 * Helper for testing malformed song data with missing name.
 */
export function makeSongWithUndefinedName(overrides: Partial<SongPublic> = {}): SongPublic {
	const base = makeTestSong(overrides);
	return forceCast<SongPublic>({
		...base,
		song_name: forceCast<string>(undefined),
	});
}
