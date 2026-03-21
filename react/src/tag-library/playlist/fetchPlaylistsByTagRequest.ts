import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type {
	PlaylistLibrary,
	PlaylistLibraryEntry,
} from "@/react/playlist-library/slice/playlist-library-types";
import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";

function isPlaylistLibrary(value: unknown): value is PlaylistLibrary {
	return (
		isRecord(value) &&
		typeof value["user_id"] === "string" &&
		typeof value["playlist_id"] === "string" &&
		typeof value["playlist_owner_id"] === "string"
	);
}

export type FetchPlaylistsByTagResult =
	| { ok: true; entries: PlaylistLibraryEntry[] }
	| { ok: false; error: string };

/**
 * Fetches the current user's library playlists tagged with the given slug.
 *
 * @param tagSlug - The tag slug to filter by
 * @returns Result with entries on success or an error message on failure
 */
export default async function fetchPlaylistsByTagRequest(
	tagSlug: string,
): Promise<FetchPlaylistsByTagResult> {
	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return { ok: true, entries: [] };
		}

		// Step 1: get playlist_ids tagged with this slug
		const tagResult = await callSelect(client, "playlist_tag", {
			cols: "playlist_id",
			eq: { col: "tag_slug", val: tagSlug },
		});
		if (!isRecord(tagResult) || tagResult.error !== null) {
			return { ok: false, error: "Failed to load playlists for this tag." };
		}
		const tagRows: unknown[] = Array.isArray(tagResult.data) ? tagResult.data : [];
		const playlistIds = tagRows
			.filter(
				(tagRow): tagRow is { playlist_id: string } =>
					isRecord(tagRow) && typeof tagRow["playlist_id"] === "string",
			)
			.map((tagRow) => tagRow.playlist_id);

		if (playlistIds.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 2: get the current user's library entries for those playlist_ids (RLS-filtered)
		const libraryResult = await callSelect(client, "playlist_library", {
			cols: "*",
			in: { col: "playlist_id", vals: playlistIds },
		});
		if (!isRecord(libraryResult) || libraryResult.error !== null) {
			return { ok: false, error: "Failed to load playlists for this tag." };
		}
		const libraryRows: unknown[] = Array.isArray(libraryResult.data) ? libraryResult.data : [];
		const libraryEntries = libraryRows.filter((row): row is PlaylistLibrary =>
			isPlaylistLibrary(row),
		);

		if (libraryEntries.length === ZERO) {
			return { ok: true, entries: [] };
		}

		// Step 3: get playlist_public details for the library entries
		const libraryPlaylistIds = libraryEntries.map((libraryEntry) => libraryEntry.playlist_id);
		const playlistPublicResult = await callSelect(client, "playlist_public", {
			cols: "playlist_id, playlist_name, playlist_slug",
			in: { col: "playlist_id", vals: libraryPlaylistIds },
		});
		const playlistPublicMap = new Map<
			string,
			{ playlist_name: string; playlist_slug: string }
		>();
		if (isRecord(playlistPublicResult) && Array.isArray(playlistPublicResult.data)) {
			for (const row of playlistPublicResult.data) {
				if (isRecord(row) && typeof row["playlist_id"] === "string") {
					playlistPublicMap.set(row["playlist_id"], {
						playlist_name:
							typeof row["playlist_name"] === "string" ? row["playlist_name"] : "",
						playlist_slug:
							typeof row["playlist_slug"] === "string" ? row["playlist_slug"] : "",
					});
				}
			}
		}

		const entries: PlaylistLibraryEntry[] = libraryEntries.map((libraryEntry) => {
			const playlistDetails = playlistPublicMap.get(libraryEntry.playlist_id);
			const entry: PlaylistLibraryEntry = libraryEntry;
			if (playlistDetails !== undefined) {
				entry.playlist_name = playlistDetails.playlist_name;
				entry.playlist_slug = playlistDetails.playlist_slug;
			}
			return entry;
		});

		return { ok: true, entries };
	} catch {
		return { ok: false, error: "Failed to load playlists for this tag." };
	}
}
