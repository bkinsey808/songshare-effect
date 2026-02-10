import type { PlaylistEntry } from "@/react/playlist/playlist-types";

/**
 * Helper to create a minimal PlaylistEntry for testing.
 */
import forceCast from "@/react/lib/test-utils/forceCast";

export function makeTestPlaylist(overrides: Partial<PlaylistEntry> = {}): PlaylistEntry {
	return forceCast<PlaylistEntry>({
		playlist_id: "p1",
		user_id: "u1",
		created_at: "2026-02-07T00:00:00Z",
		updated_at: "2026-02-07T00:00:00Z",
		private_notes: "",
		public: {
			playlist_id: "p1",
			playlist_name: "Test Playlist",
			playlist_slug: "test-playlist",
			user_id: "u1",
			song_order: [],
			created_at: "2026-02-07T00:00:00Z",
			updated_at: "2026-02-07T00:00:00Z",
			public_notes: "",
		},
		...overrides,
	});
}

/**
 * Helper for testing malformed playlist data with missing song order.
 */
export function makePlaylistWithUndefinedSongOrder(): PlaylistEntry {
	const base = makeTestPlaylist();
	return forceCast<PlaylistEntry>({
		...base,
		public: {
			...base.public,
			song_order: forceCast<string[]>(undefined),
		},
	});
}

/**
 * Helper for testing malformed playlist data with missing name.
 */
export function makePlaylistWithUndefinedName(): PlaylistEntry {
	const base = makeTestPlaylist();
	return forceCast<PlaylistEntry>({
		...base,
		public: {
			...base.public,
			playlist_name: forceCast<string>(undefined),
		},
	});
}
