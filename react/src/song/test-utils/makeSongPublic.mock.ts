import type { SongPublic } from "../song-schema";

/**
 * Build a test `SongPublic` object with sensible defaults that tests can override.
 *
 * @param overrides - Partial properties to override the default fixture
 * @returns A `SongPublic` fixture object
 */
export default function makeSongPublic(overrides: Partial<SongPublic> = {}): SongPublic {
	// oxlint-disable-next-line unicorn/no-null
	const DB_NULL: string | null = null;
	return {
		song_id: overrides.song_id ?? "s1",
		song_name: overrides.song_name ?? "My Song",
		song_slug: overrides.song_slug ?? "my-slug",
		fields: overrides.fields ?? ["lyrics"],
		slide_order: overrides.slide_order ?? ["slide-1"],
		slides: overrides.slides ?? {
			"slide-1": { slide_name: "Verse 1", field_data: { lyrics: "Hello" } },
		},
		key: overrides.key ?? DB_NULL,
		scale: overrides.scale ?? DB_NULL,
		user_id: overrides.user_id ?? "u1",
		short_credit: overrides.short_credit ?? DB_NULL,
		long_credit: overrides.long_credit ?? DB_NULL,
		public_notes: overrides.public_notes ?? DB_NULL,
		created_at: overrides.created_at ?? new Date("2025-01-01T00:00:00Z").toISOString(),
		updated_at: overrides.updated_at ?? new Date("2025-01-01T00:00:00Z").toISOString(),
		...overrides,
	};
}
