import type { Song } from "@/shared/generated/supabaseSchemas";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";
import { safeGet } from "@/shared/utils/safe";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

/**
 * Add private songs to the active subscription list by slug. Fetches any
 * missing songs for the current user and updates the store's private songs
 * and active private song ids accordingly.
 *
 * @param set - Zustand set function for the SongSubscribe slice
 * @param get - Getter for the current slice state
 * @returns A function accepting an array of song slugs and returning a Promise
 */
export default function addActivePrivateSongSlugs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return async (songSlugs: readonly string[]): Promise<void> => {
		const sliceState = get();
		const currentPublicSongs = sliceState.publicSongs;

		// Find missing song slugs that are not already being subscribed to.
		const activePrivateSongSlugs = new Set(
			sliceState.activePrivateSongIds
				.map((id: string) => {
					const song = safeGet(currentPublicSongs, id);
					if (
						song &&
						typeof song === "object" &&
						song !== null &&
						typeof song["song_slug"] === "string"
					) {
						return song["song_slug"];
					}
					return undefined;
				})
				.filter((slug: unknown): slug is string => typeof slug === "string"),
		);
		const missingSongSlugs = songSlugs.filter((slug) => !activePrivateSongSlugs.has(slug));
		const NO_MISSING_SONGS = 0;

		if (missingSongSlugs.length === NO_MISSING_SONGS) {
			console.warn("[addActivePrivateSongSlugs] All song slugs already active, nothing to do.");
			return;
		}

		// Read optional userToken via the app-level state when available.
		let userToken: string | undefined = undefined;
		if (typeof sliceState === "object" && sliceState !== null && "userToken" in sliceState) {
			const ut = (sliceState as { userToken?: unknown }).userToken;
			if (typeof ut === "string") {
				userToken = ut;
			}
		}
		if (userToken === undefined || userToken === null || userToken.trim() === "") {
			console.warn("[addActivePrivateSongSlugs] No user token found. Cannot fetch songs.");
			return;
		}

		function isSongRow(value: unknown): value is Song {
			if (!isRecord(value)) {
				return false;
			}
			const rec = value;
			return (
				typeof rec["song_id"] === "string" &&
				typeof rec["created_at"] === "string" &&
				typeof rec["updated_at"] === "string"
			);
		}

		const supabase = getSupabaseClient(userToken);
		if (supabase === undefined) {
			console.warn("[addActivePrivateSongSlugs] Supabase client not initialized.");
			return;
		}

		try {
			const songQueryRes = await callSelect(supabase, "song", {
				cols: "*, song_public(song_slug)",
				in: { col: "song_public.song_slug", vals: missingSongSlugs },
			});

			if (!isRecord(songQueryRes)) {
				console.error("[addActivePrivateSongSlugs] Supabase fetch error:", songQueryRes);
				return;
			}

			const data = Array.isArray(songQueryRes["data"]) ? songQueryRes["data"] : [];
			console.warn("[addActivePrivateSongSlugs] Fetched data:", data);

			// Simple validation assuming the data structure is correct
			if (Array.isArray(data)) {
				const privateSongsToAdd: Record<string, Song> = {};

				for (const song of data) {
					if (isSongRow(song)) {
						privateSongsToAdd[song.song_id] = song;
					}
				}
				console.warn("[addActivePrivateSongSlugs] Updating store with songs:", privateSongsToAdd);
				const storeForOps = sliceState;
				storeForOps.addOrUpdatePrivateSongs(privateSongsToAdd);

				// Update activePrivateSongIds to include newly fetched songs
				const newActivePrivateSongIds: readonly string[] = [
					...new Set([...storeForOps.activePrivateSongIds, ...Object.keys(privateSongsToAdd)]),
				];

				// unsubscribe from previous subscription if exists
				if (typeof storeForOps.activePrivateSongsUnsubscribe === "function") {
					storeForOps.activePrivateSongsUnsubscribe();
				}

				// subscribe to new set
				const activePrivateSongsUnsubscribe = storeForOps.subscribeToActivePrivateSongs();

				set(() => ({
					activePrivateSongsUnsubscribe:
						activePrivateSongsUnsubscribe ?? ((): undefined => undefined),
					activePrivateSongIds: newActivePrivateSongIds,
				}));
			} else {
				console.error("[addActivePrivateSongSlugs] Invalid data format:", data);
			}
		} catch (error) {
			console.error("[addActivePrivateSongSlugs] Unexpected fetch error:", error);
		}
	};
}
