import forceCast from "@/react/lib/test-utils/forceCast";
import type { SongLibraryEntry } from "@/react/song-library/slice/song-library-types";

/**
 * Create a `SongLibraryEntry` fixture for tests.
 *
 * @param overrides - Partial song library entry fields to override.
 * @returns A `SongLibraryEntry` fixture.
 */
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
