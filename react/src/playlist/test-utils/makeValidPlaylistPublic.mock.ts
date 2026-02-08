/**
 * Create a valid PlaylistPublic-like record for use in tests.
 *
 * The returned object contains the minimal required properties for the
 * `isPlaylistPublic` type guard to succeed. Use copies of this object when
 * testing variations so the base fixture remains unchanged.
 *
 * @returns A shallow object shaped like a `PlaylistPublic` record.
 */
import makePlaylistPublic from "./makePlaylistPublic.mock";

export default function makeValidPlaylistPublic(): Record<string, unknown> {
	// Delegate to the full fixture and override only the minimal fields
	return makePlaylistPublic({
		playlist_name: "My Playlist",
		playlist_slug: "my-playlist",
		song_order: ["s1", "s2"],
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-01-02T00:00:00Z",
	});
}
