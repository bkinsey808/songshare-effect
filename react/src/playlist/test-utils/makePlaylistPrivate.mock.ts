/**
 * Create a realistic private `playlist` record for tests (overrides public fields).
 *
 * @param attrs - Partial attributes to override the record defaults.
 * @returns A plain object representing a private `playlist` row suitable for use in tests.
 */
export default function makePlaylistPrivate(
	attrs: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
	return {
		playlist_id: "00000000-0000-0000-0000-000000000001",
		user_id: "00000000-0000-0000-0000-000000000002",
		private_notes: "private note",
		created_at: "2020-02-01T00:00:00Z",
		updated_at: "2020-02-02T00:00:00Z",
		...attrs,
	};
}
