/**
 * Create a realistic `playlist_public` record for tests.
 *
 * @param attrs - Partial attributes to override the record defaults.
 * @returns A plain object representing a `playlist_public` row suitable for use in tests.
 */
export default function makePlaylistPublic(
	attrs: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
	return {
		playlist_id: "00000000-0000-0000-0000-000000000001",
		user_id: "00000000-0000-0000-0000-000000000002",
		playlist_slug: "slug-1",
		playlist_name: "My Playlist",
		created_at: "2020-01-01T00:00:00Z",
		updated_at: "2020-01-02T00:00:00Z",
		song_order: ["song-1"],
		...attrs,
	};
}
