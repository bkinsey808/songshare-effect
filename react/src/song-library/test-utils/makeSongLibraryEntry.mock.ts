import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";

import forceCast from "@/react/lib/test-utils/forceCast";

export default function makeSongLibraryEntry(
	overrides: Partial<SongLibraryEntry> = {},
): SongLibraryEntry {
	const now = new Date().toISOString();
	return forceCast<SongLibraryEntry>({
		song_id: "song-123",
		song_owner_id: "owner-1",
		user_id: "u1",
		created_at: now,
		owner_username: overrides.owner_username ?? "owner_user",
		...overrides,
	});
}
