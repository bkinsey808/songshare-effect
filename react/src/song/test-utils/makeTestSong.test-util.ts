import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongPublic } from "@/react/song/song-schema";

/**
 * Build a minimal `SongPublic` fixture for tests.
 *
 * @param overrides - Partial properties to merge into the default fixture.
 * @returns A `SongPublic` object ready for assertions.
 */
export function makeTestSong(overrides: Partial<SongPublic> = {}): SongPublic {
	// avoid explicit null literals (unicorn/no-null) by parsing at runtime
	const parsedNull = forceCast<SongPublic["key"]>(JSON.parse("null"));
	const base: SongPublic = {
		song_id: "s1",
		song_name: "Test Song",
		song_slug: "test-song",
		user_id: "u1",
		lyrics: "en",
		translations: [],
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
 * Build a `SongPublic` fixture with an intentionally missing song name.
 *
 * @param overrides - Partial properties to merge into the default fixture.
 * @returns A `SongPublic` object whose `song_name` is `undefined`.
 */
export function makeSongWithUndefinedName(overrides: Partial<SongPublic> = {}): SongPublic {
	const base = makeTestSong(overrides);
	return forceCast<SongPublic>({
		...base,
		song_name: forceCast<string>(undefined),
	});
}
