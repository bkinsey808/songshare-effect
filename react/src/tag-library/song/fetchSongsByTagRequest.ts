import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isSongLibraryEntry from "@/react/song-library/slice/guards/isSongLibraryEntry";
import type { SongLibrary, SongLibraryEntry } from "@/react/song-library/slice/song-library-types";
import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";

export type FetchSongsByTagResult =
	| { ok: true; entries: SongLibraryEntry[] }
	| { ok: false; error: string };

/**
 * Fetches the current user's library songs tagged with the given slug.
 *
 * @param tagSlug - The tag slug to filter by
 * @returns Result with entries on success or an error message on failure
 */
export default async function fetchSongsByTagRequest(
	tagSlug: string,
): Promise<FetchSongsByTagResult> {
	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return { ok: true, entries: [] };
		}

		// Step 1: get song_ids tagged with this slug
		const tagResult = await callSelect(client, "song_tag", {
			cols: "song_id",
			eq: { col: "tag_slug", val: tagSlug },
		});
		if (!isRecord(tagResult) || tagResult.error !== null) {
			return { ok: false, error: "Failed to load songs for this tag." };
		}
		const tagRows: unknown[] = Array.isArray(tagResult.data) ? tagResult.data : [];
		const songIds = tagRows
			.filter(
				(tagRow): tagRow is { song_id: string } =>
					isRecord(tagRow) && typeof tagRow["song_id"] === "string",
			)
			.map((tagRow) => tagRow.song_id);

		if (songIds.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 2: get the current user's library entries for those song_ids (RLS-filtered)
		const libraryResult = await callSelect(client, "song_library", {
			cols: "*",
			in: { col: "song_id", vals: songIds },
		});
		if (!isRecord(libraryResult) || libraryResult.error !== null) {
			return { ok: false, error: "Failed to load songs for this tag." };
		}
		const libraryRows: unknown[] = Array.isArray(libraryResult.data) ? libraryResult.data : [];
		const libraryEntries = libraryRows.filter((row): row is SongLibrary => isSongLibraryEntry(row));

		if (libraryEntries.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 3: get song_public details for the library entries
		const librarySongIds = libraryEntries.map((libraryEntry) => libraryEntry.song_id);
		const songPublicResult = await callSelect(client, "song_public", {
			cols: "song_id, song_name, song_slug",
			in: { col: "song_id", vals: librarySongIds },
		});
		const songPublicMap = new Map<string, { song_name: string; song_slug: string }>();
		if (isRecord(songPublicResult) && Array.isArray(songPublicResult.data)) {
			for (const row of songPublicResult.data) {
				if (isRecord(row) && typeof row["song_id"] === "string") {
					songPublicMap.set(row["song_id"], {
						song_name: typeof row["song_name"] === "string" ? row["song_name"] : "",
						song_slug: typeof row["song_slug"] === "string" ? row["song_slug"] : "",
					});
				}
			}
		}

		const entries: SongLibraryEntry[] = libraryEntries.map((libraryEntry) => {
			const songDetails = songPublicMap.get(libraryEntry.song_id);
			const entry: SongLibraryEntry = libraryEntry;
			if (songDetails !== undefined) {
				entry.song_name = songDetails.song_name;
				entry.song_slug = songDetails.song_slug;
			}
			return entry;
		});

		return { ok: true, entries };
	} catch {
		return { ok: false, error: "Failed to load songs for this tag." };
	}
}
