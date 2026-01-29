import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { PlaylistLibrarySlice } from "./playlist-library-slice";
import type { PlaylistLibrary, PlaylistLibraryEntry } from "./playlist-library-types";

/**
 * Validates that a value is a valid PlaylistLibrary record.
 * @param value - The value to check.
 * @returns True if the value is a valid PlaylistLibrary.
 */
function isPlaylistLibraryEntry(value: unknown): value is PlaylistLibrary {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value["user_id"] === "string" &&
		typeof value["playlist_id"] === "string" &&
		typeof value["playlist_owner_id"] === "string"
	);
}

/**
 * Fetch the current user's playlist library and populate the slice with enriched
 * entries (includes owner username and playlist public details when available).
 *
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that resolves when the library is fetched
 */
export default function fetchPlaylistLibrary(
	get: () => PlaylistLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchPlaylistLibraryGen($) {
		const { setPlaylistLibraryEntries, setPlaylistLibraryLoading, setPlaylistLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				console.warn("[fetchPlaylistLibrary] Starting fetch...");
				setPlaylistLibraryLoading(true);
				setPlaylistLibraryError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (err) => new Error(String(err)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		// Fetch playlist library entries
		const libraryQueryRes = yield* $(
			Effect.tryPromise({
				try: async () => {
					const res = await callSelect(client, "playlist_library", { cols: "*" });
					console.warn("[fetchPlaylistLibrary] Query result:", JSON.stringify(res));
					return res;
				},
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(libraryQueryRes)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching playlist_library")),
			);
		}

		const libraryData: unknown[] = Array.isArray(libraryQueryRes["data"])
			? libraryQueryRes["data"]
			: [];

		const filteredEntriesArray = libraryData.filter((entry: unknown): entry is PlaylistLibrary => {
			const isValid = isPlaylistLibraryEntry(entry);
			if (!isValid) {
				console.warn("[fetchPlaylistLibrary] Row failed type guard:", JSON.stringify(entry));
			}
			return isValid;
		});

		console.warn(
			`[fetchPlaylistLibrary] ${filteredEntriesArray.length} entries remain after type guard`,
		);

		// Fetch playlist public data for all playlists
		const playlistIds = [
			...new Set(filteredEntriesArray.map((entry: PlaylistLibrary) => entry.playlist_id)),
		];

		const rawPlaylistResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "playlist_public", {
						cols: "playlist_id, playlist_name, playlist_slug",
						in: { col: "playlist_id", vals: playlistIds },
					}),
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(rawPlaylistResult)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching playlist_public")),
			);
		}

		const playlistData: unknown[] = Array.isArray(rawPlaylistResult["data"])
			? rawPlaylistResult["data"]
			: [];

		const playlistRecords = playlistData.filter(
			(item: unknown): item is Record<string, unknown> =>
				isRecord(item) && typeof item["playlist_id"] === "string",
		);

		const playlistMapEntries = playlistRecords
			.map((playlist) => {
				const maybeId = playlist["playlist_id"];
				if (typeof maybeId !== "string") {
					return undefined;
				}
				const playlistName = guardAsString(playlist["playlist_name"]);
				const playlistSlug = guardAsString(playlist["playlist_slug"]);
				return [maybeId, { playlist_name: playlistName, playlist_slug: playlistSlug }] as [
					string,
					{ playlist_name: string; playlist_slug: string },
				];
			})
			.filter(
				(entry): entry is [string, { playlist_name: string; playlist_slug: string }] =>
					entry !== undefined,
			);

		const playlistMap = new Map<string, { playlist_name: string; playlist_slug: string }>(
			playlistMapEntries,
		);

		// Fetch owner usernames
		const ownerIds = [
			...new Set(filteredEntriesArray.map((entry: PlaylistLibrary) => entry.playlist_owner_id)),
		];

		const rawOwnerResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "user_public", {
						cols: "user_id, username",
						in: { col: "user_id", vals: ownerIds },
					}),
				catch: (err) => new Error(String(err)),
			}),
		);

		if (!isRecord(rawOwnerResult)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching user_public")),
			);
		}

		const ownerData = Array.isArray(rawOwnerResult["data"]) ? rawOwnerResult["data"] : [];

		const ownerArray = (ownerData ?? []).filter(
			(ownerItem: unknown): ownerItem is { user_id: string; username: string } =>
				isRecord(ownerItem) &&
				typeof ownerItem["user_id"] === "string" &&
				typeof ownerItem["username"] === "string",
		);

		const ownerMap = new Map(ownerArray.map((owner) => [owner.user_id, owner.username]));

		// Build the entries record
		const entriesRecord = filteredEntriesArray.reduce<Record<string, PlaylistLibraryEntry>>(
			(acc: Record<string, PlaylistLibraryEntry>, entry: PlaylistLibrary) => {
				const ownerUsername: string | undefined = ownerMap.get(entry.playlist_owner_id);
				const playlistDetails: { playlist_name?: string; playlist_slug?: string } | undefined =
					playlistMap.get(entry.playlist_id);

				const libraryEntry: PlaylistLibraryEntry = {
					...entry,
					...(ownerUsername !== undefined && {
						owner_username: ownerUsername,
					}),
					...(playlistDetails !== undefined && {
						playlist_name: playlistDetails.playlist_name,
						playlist_slug: playlistDetails.playlist_slug,
					}),
				};

				acc[entry.playlist_id] = libraryEntry;
				return acc;
			},
			{},
		);

		yield* $(
			Effect.sync(() => {
				const indent = 2;
				console.warn(
					`[fetchPlaylistLibrary] Applying ${Object.keys(entriesRecord).length} entries to store:`,
					JSON.stringify(entriesRecord, undefined, indent),
				);
				setPlaylistLibraryEntries(entriesRecord);
			}),
		);

		console.warn("[fetchPlaylistLibrary] Complete.");
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setPlaylistLibraryLoading, setPlaylistLibraryError } = get();
				setPlaylistLibraryLoading(false);
				setPlaylistLibraryError("Failed to fetch playlist library");
				console.error("[fetchPlaylistLibrary] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setPlaylistLibraryLoading } = get();
				setPlaylistLibraryLoading(false);
			}),
		),
	);
}
