import type { SongLibrary, UserPublic } from "@/shared/generated/supabaseSchemas";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import { isRecord } from "@/shared/utils/typeGuards";

import type { SongLibrarySlice } from "./song-library-slice";
import type { SongLibraryEntry } from "./song-library-types";

import isSongLibraryEntry from "./isSongLibraryEntry";

const ZERO = 0;

/**
 * Fetch the current user's song library and populate the slice with enriched
 * entries (includes owner username and song public details when available).
 *
 * @param get - Zustand slice getter used to access state and mutation helpers
 */
export default async function fetchSongLibrary(get: () => SongLibrarySlice): Promise<void> {
	const { setSongLibraryEntries, setSongLibraryLoading, setSongLibraryError } = get();

	// Start fresh
	setSongLibraryLoading(true);
	setSongLibraryError(undefined);

	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);

		if (!client) {
			throw new Error("No Supabase client available");
		}

		console.warn("[fetchSongLibrary] Fetching song_library entries...");
		const libraryQueryRes = await callSelect(client, "song_library", { cols: "*" });
		if (!isRecord(libraryQueryRes)) {
			throw new Error("Invalid response from Supabase fetching song_library");
		}
		const libraryData: unknown[] = Array.isArray(libraryQueryRes["data"])
			? libraryQueryRes["data"]
			: [];

		// Filter out malformed rows received from Supabase to avoid runtime errors
		const filteredEntriesArray = libraryData.filter((entry: unknown): entry is SongLibrary =>
			isSongLibraryEntry(entry),
		);

		const songIds = [...new Set(filteredEntriesArray.map((entry: SongLibrary) => entry.song_id))];
		console.warn("[fetchSongLibrary] Fetching song_public for song IDs:", songIds);
		const rawSongResult = await callSelect(client, "song_public", {
			cols: "song_id, song_name, song_slug",
			in: { col: "song_id", vals: songIds },
		});
		if (!isRecord(rawSongResult)) {
			throw new Error("Invalid response from Supabase fetching song_public");
		}
		const songData: unknown[] = Array.isArray(rawSongResult["data"]) ? rawSongResult["data"] : [];
		console.warn(
			"[fetchSongLibrary] Received song_public data:",
			songData.length ?? ZERO,
			songData,
		);

		// Create a map of song_id to song details (filter malformed rows)
		const songRecords = songData.filter(
			(item: unknown): item is Record<string, unknown> =>
				isRecord(item) && typeof item["song_id"] === "string",
		);
		const songMapEntries = songRecords
			.map((song) => {
				const maybeId = song["song_id"];
				if (typeof maybeId !== "string") {
					return undefined;
				}
				const songName = typeof song["song_name"] === "string" ? song["song_name"] : "";
				const songSlug = typeof song["song_slug"] === "string" ? song["song_slug"] : "";
				return [maybeId, { song_name: songName, song_slug: songSlug }] as [
					string,
					{ song_name: string; song_slug: string },
				];
			})
			.filter(
				(entry): entry is [string, { song_name: string; song_slug: string }] => entry !== undefined,
			);
		const songMap = new Map<string, { song_name: string; song_slug: string }>(songMapEntries);

		// Fetch owner usernames for all entries
		const ownerIds = [
			...new Set(filteredEntriesArray.map((entry: SongLibrary) => entry.song_owner_id)),
		];
		const rawOwnerResult = await callSelect(client, "user_public", {
			cols: "user_id, username",
			in: { col: "user_id", vals: ownerIds },
		});
		if (!isRecord(rawOwnerResult)) {
			throw new Error("Invalid response from Supabase fetching user_public");
		}
		const ownerData = Array.isArray(rawOwnerResult["data"]) ? rawOwnerResult["data"] : [];

		console.warn(
			"[fetchSongLibrary] Received user_public data:",
			ownerData.length ?? ZERO,
			ownerData,
		);

		// Create a map of owner_id to username (filter malformed rows)
		const ownerArray = (ownerData ?? []).filter(
			(ownerItem: unknown): ownerItem is UserPublic =>
				isRecord(ownerItem) &&
				typeof ownerItem["user_id"] === "string" &&
				typeof ownerItem["username"] === "string",
		);
		const ownerMap = new Map(
			ownerArray.map((owner: UserPublic) => [owner.user_id, owner.username]),
		);

		// Convert array to object indexed by song_id and include owner username and song details
		const entriesRecord = filteredEntriesArray.reduce<Record<string, SongLibraryEntry>>(
			(acc: Record<string, SongLibraryEntry>, entry: SongLibrary) => {
				const ownerUsername: string | undefined = ownerMap.get(entry.song_owner_id);
				const songDetails: { song_name?: string; song_slug?: string } | undefined = songMap.get(
					entry.song_id,
				);
				const libraryEntry: SongLibraryEntry = {
					...entry,
					...(ownerUsername !== undefined && {
						owner_username: ownerUsername,
					}),
					...(songDetails !== undefined && {
						song_name: songDetails.song_name,
						song_slug: songDetails.song_slug,
					}),
				};

				acc[entry.song_id] = libraryEntry;
				return acc;
			},
			{},
		);

		setSongLibraryEntries(entriesRecord);
	} finally {
		setSongLibraryLoading(false);
	}
}
