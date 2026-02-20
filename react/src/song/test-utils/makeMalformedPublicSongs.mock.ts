import type { SongPublic } from "@/react/song/song-schema";

/**
 * Create a small set of malformed public song objects for negative tests.
 *
 * @returns Array of malformed public song objects
 */
export default function makeMalformedPublicSongs(): Record<string, SongPublic> {
	const publicSongs: Record<string, unknown> = {
		valid: {
			song_id: "valid",
			song_slug: "valid",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		},
		badUndefined: undefined,
		badType: { song_slug: 123 },
	};

	// Localized cast: this helper intentionally returns malformed shapes (e.g.,
	// `undefined` and wrong field types) so tests can exercise defensive
	// behavior. Centralizing the single narrow cast here avoids repeated
	// inline disables across many tests.
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only: intentionally malformed fixture */
	return publicSongs as unknown as Record<string, SongPublic>;
}
