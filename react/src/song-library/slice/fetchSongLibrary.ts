import { Effect } from "effect";

import type { SongLibrary, UserPublic } from "@/shared/generated/supabaseSchemas";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import guardAsString from "@/shared/type-guards/guardAsString";
import isRecord from "@/shared/type-guards/isRecord";

import type { SongLibrarySlice } from "./song-library-slice";
import type { SongLibraryEntry } from "./song-library-types";

import isSongLibraryEntry from "./guards/isSongLibraryEntry";

// Simple JWT decoder for debugging
function decodeJwt(token: string): Record<string, unknown> | undefined {
	try {
		const segments = token.split(".");
		const [, payloadSegment] = segments;
		if (payloadSegment === undefined || payloadSegment === "") {
			return undefined;
		}
		const base64 = payloadSegment.replaceAll("-", "+").replaceAll("_", "/");
		const jsonPayload = atob(base64);
		const parsed: unknown = JSON.parse(jsonPayload);
		if (isRecord(parsed)) {
			return parsed;
		}
		return undefined;
	} catch (error) {
		console.error("[fetchSongLibrary] JWT decode error:", error);
		return undefined;
	}
}

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
				console.warn("[fetchSongLibrary] Starting fetch...");
				setSongLibraryLoading(true);
				setSongLibraryError(undefined);
			}),
		);

		const userToken = yield* $(
			Effect.tryPromise({
				try: async () => {
					const token = await getSupabaseAuthToken();
					if (token !== undefined && token !== "") {
						const decoded = decodeJwt(token);
						console.warn("[fetchSongLibrary] Token payload:", JSON.stringify(decoded));
					}
					return token;
				},
				catch: (err) => new Error(String(err)),
			}),
		);
		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const libraryQueryRes = yield* $(
			Effect.tryPromise({
				try: async () => {
					const res = await callSelect(client, "song_library", { cols: "*" });
					console.warn("[fetchSongLibrary] Query result:", JSON.stringify(res));
					return res;
				},
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

		const filteredEntriesArray = libraryData.filter((entry: unknown): entry is SongLibrary => {
			const isValid = isSongLibraryEntry(entry);
			if (!isValid) {
				console.warn("[fetchSongLibrary] Row failed type guard:", JSON.stringify(entry));
			}
			return isValid;
		});

		console.warn(
			`[fetchSongLibrary] ${filteredEntriesArray.length} entries remains after type guard`,
		);

		const songIds = [...new Set(filteredEntriesArray.map((entry: SongLibrary) => entry.song_id))];
		const rawSongResult = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect(client, "song_public", {
						cols: "song_id, song_name, song_slug",
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
				return [maybeId, { song_name: songName, song_slug: songSlug }] as [
					string,
					{ song_name: string; song_slug: string },
				];
			})
			.filter(
				(entry): entry is [string, { song_name: string; song_slug: string }] => entry !== undefined,
			);
		const songMap = new Map<string, { song_name: string; song_slug: string }>(songMapEntries);

		const ownerIds = [
			...new Set(filteredEntriesArray.map((entry: SongLibrary) => entry.song_owner_id)),
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

		yield* $(
			Effect.sync(() => {
				const indent = 2;
				console.warn(
					`[fetchSongLibrary] Applying ${Object.keys(entriesRecord).length} entries to store:`,
					JSON.stringify(entriesRecord, undefined, indent),
				);
				setSongLibraryEntries(entriesRecord);
			}),
		);
		console.warn("[fetchSongLibrary] Complete.");
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
