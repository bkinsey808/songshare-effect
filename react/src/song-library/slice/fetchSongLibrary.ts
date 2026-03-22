import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SongLibrary, UserPublic } from "@/shared/generated/supabaseSchemas";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import isSongLibraryEntry from "./guards/isSongLibraryEntry";
import type { SongLibrarySlice } from "./song-library-slice";
import type { SongLibraryEntry } from "./song-library-types";

/**
 * Fetch the current user's song library and populate the slice with enriched
 * entries (includes owner username and song public details when available).
 *
 * @param get - Zustand slice getter used to access state and mutation helpers
 * @returns Effect that completes when the library has been fetched or fails with `Error`
 */
export default function fetchSongLibrary(get: () => SongLibrarySlice): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchSongGen($) {
		const { setSongLibraryEntries, setSongLibraryLoading, setSongLibraryError } = get();

		yield* $(
			Effect.sync(() => {
				setSongLibraryLoading(true);
				setSongLibraryError(undefined);
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

		const libraryQueryRes = yield* $(
			Effect.tryPromise({
				try: () => callSelect(client, "song_library", { cols: "*" }),
				catch: (err) => new Error(String(err)),
			}),
		);
		if (!isRecord(libraryQueryRes)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching song_library")),
			);
		}
		const libraryData: unknown[] = Array.isArray(libraryQueryRes["data"])
			? libraryQueryRes["data"]
			: [];

		const filteredEntriesArray = libraryData.filter((entry: unknown): entry is SongLibrary =>
			isSongLibraryEntry(entry),
		);

		const songIds = [...new Set(filteredEntriesArray.map((entry: SongLibrary) => entry.song_id))];
		const rawSongResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "song_public", {
						cols: "song_id, song_name, song_slug, user_id",
						in: { col: "song_id", vals: songIds },
					}),
				catch: (err) => new Error(String(err)),
			}),
		);
		if (!isRecord(rawSongResult)) {
			return yield* $(
				Effect.fail(new Error("Invalid response from Supabase fetching song_public")),
			);
		}
		const songData: unknown[] = Array.isArray(rawSongResult["data"]) ? rawSongResult["data"] : [];

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
				const songName = guardAsString(song["song_name"]);
				const songSlug = guardAsString(song["song_slug"]);
				const userId = typeof song["user_id"] === "string" ? song["user_id"] : undefined;
				return [maybeId, { song_name: songName, song_slug: songSlug, user_id: userId }] as [
					string,
					{ song_name: string; song_slug: string; user_id: string | undefined },
				];
			})
			.filter(
				(entry): entry is [string, { song_name: string; song_slug: string; user_id: string | undefined }] => entry !== undefined,
			);
		const songMap = new Map<string, { song_name: string; song_slug: string; user_id: string | undefined }>(songMapEntries);

		const ownerIds = [
			...new Set(
				filteredEntriesArray
					.map((entry: SongLibrary) => songMap.get(entry.song_id)?.user_id)
					.filter((id): id is string => id !== undefined),
			),
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
			(ownerItem: unknown): ownerItem is UserPublic =>
				isRecord(ownerItem) &&
				typeof ownerItem["user_id"] === "string" &&
				typeof ownerItem["username"] === "string",
		);
		const ownerMap = new Map(
			ownerArray.map((owner: UserPublic) => [owner.user_id, owner.username]),
		);

		const entriesRecord = filteredEntriesArray.reduce<Record<string, SongLibraryEntry>>(
			(acc: Record<string, SongLibraryEntry>, entry: SongLibrary) => {
				const songDetails = songMap.get(entry.song_id);
				const songOwnerId: string | undefined = songDetails?.user_id;
				const ownerUsername: string | undefined =
					songOwnerId === undefined ? undefined : ownerMap.get(songOwnerId);
				const libraryEntry: SongLibraryEntry = {
					...entry,
					...(songOwnerId !== undefined && { song_owner_id: songOwnerId }),
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

		yield* $(
			Effect.sync(() => {
				setSongLibraryEntries(entriesRecord);
			}),
		);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setSongLibraryLoading, setSongLibraryError } = get();
				setSongLibraryLoading(false);
				setSongLibraryError("Failed to fetch library");
				console.error("[fetchSongLibrary] Error:", err);
			}),
		),
		Effect.ensuring(
			Effect.sync(() => {
				const { setSongLibraryLoading } = get();
				setSongLibraryLoading(false);
			}),
		),
	);
}
