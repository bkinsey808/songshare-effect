import type { PlaylistEntry } from "@/react/playlist/playlist-types";

/**
 * Helper to create a minimal PlaylistEntry for testing.
 */
export function makeTestPlaylist(overrides: Partial<PlaylistEntry> = {}): PlaylistEntry {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return {
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
	} as unknown as PlaylistEntry;
}

/**
 * Helper for testing malformed playlist data with missing song order.
 */
export function makePlaylistWithUndefinedSongOrder(): PlaylistEntry {
	const base = makeTestPlaylist();
	return {
		...base,
		public: {
			...base.public,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			song_order: undefined as unknown as string[],
		},
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	} as unknown as PlaylistEntry;
}

/**
 * Helper for testing malformed playlist data with missing name.
 */
export function makePlaylistWithUndefinedName(): PlaylistEntry {
	const base = makeTestPlaylist();
	return {
		...base,
		public: {
			...base.public,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			playlist_name: undefined as unknown as string,
		},
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	} as unknown as PlaylistEntry;
}
