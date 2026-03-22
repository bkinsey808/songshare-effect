import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";

export default function makeSongLibraryEntry(
	overrides: Partial<SongLibraryEntry> = {},
): SongLibraryEntry {
	const now = new Date().toISOString();
	return forceCast<SongLibraryEntry>({
		song_id: "song-123",
		user_id: "u1",
		created_at: now,
		owner_username: overrides.owner_username ?? "owner_user",
		...overrides,
	});
}
