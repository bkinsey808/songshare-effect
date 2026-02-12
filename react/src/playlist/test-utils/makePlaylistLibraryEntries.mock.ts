import type { PlaylistLibraryEntry } from "@/react/playlist-library/slice/playlist-library-types";

import forceCast from "@/react/lib/test-utils/forceCast";

export default function makePlaylistLibraryEntries(): Record<string, PlaylistLibraryEntry> {
	const now = new Date().toISOString();
	return {
		p1: forceCast<PlaylistLibraryEntry>({
			created_at: now,
			user_id: "u1",
			playlist_owner_id: "o1",
			playlist_id: "p1",
			playlist_name: "My Playlist",
			playlist_slug: "my-playlist",
		}),
		p2: forceCast<PlaylistLibraryEntry>({
			created_at: now,
			user_id: "u2",
			playlist_owner_id: "o2",
			playlist_id: "p2",
			playlist_name: "Another One",
			playlist_slug: "another-one",
		}),
		p3: forceCast<PlaylistLibraryEntry>({
			created_at: now,
			user_id: "u3",
			playlist_owner_id: "o3",
			playlist_id: "p3",
			playlist_name: "",
			playlist_slug: "no-slug",
		}),
	};
}
