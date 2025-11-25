import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { getStoreApi } from "@/react/zustand/useAppStore";
import { safeGet } from "@/shared/utils/safe";
import { isRecord } from "@/shared/utils/typeGuards";

// src/features/react/song-subscribe/addActiveSongIds.ts
import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";

export default function addActivePrivateSongSlugs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return async (songSlugs: ReadonlyArray<string>): Promise<void> => {
		const storeApi = getStoreApi();
		const appState = storeApi ? storeApi.getState() : undefined;
		const sliceState = get();

		const currentPublicSongs = (appState ?? sliceState).publicSongs;

		// Find missing song slugs that are not already being subscribed to.
		const activePrivateSongSlugs = new Set(
			(appState ?? sliceState).activePrivateSongIds
				.map((id) => {
					const song = safeGet(currentPublicSongs, id) as unknown;
					function isRecordStringUnknown(
						x: unknown,
					): x is Record<string, unknown> {
						return typeof x === "object" && x !== null;
					}
					return isRecordStringUnknown(song) &&
						typeof song["song_slug"] === "string"
						? song["song_slug"]
						: undefined;
				})
				.filter((slug): slug is string => typeof slug === "string"),
		);
		const missingSongSlugs = songSlugs.filter(
			(slug) => !activePrivateSongSlugs.has(slug),
		);
		if (missingSongSlugs.length === 0) {
			console.log(
				"[addActivePrivateSongSlugs] All song slugs already active, nothing to do.",
			);
			return;
		}

		// Read optional userToken via the app-level state when available.
		let userToken: string | undefined;
		if (appState) {
			const appStateUnknown: unknown = appState;
			if (
				isRecord(appStateUnknown) &&
				typeof appStateUnknown["userToken"] === "string"
			) {
				userToken = appStateUnknown["userToken"];
			}
		}
		if (typeof userToken !== "string") {
			console.warn(
				"[addActivePrivateSongSlugs] No user token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(userToken);
		if (supabase === undefined) {
			console.warn(
				"[addActivePrivateSongSlugs] Supabase client not initialized.",
			);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("song")
				.select("*, song_public(song_slug)")
				.in("song_public.song_slug", missingSongSlugs);

			if (error !== null) {
				console.error(
					"[addActivePrivateSongSlugs] Supabase fetch error:",
					error,
				);
				return;
			}

			console.warn("[addActivePrivateSongSlugs] Fetched data:", data);

			// Simple validation assuming the data structure is correct
			if (Array.isArray(data)) {
				const privateSongsToAdd: Record<string, Song> = {};

				for (const song of data) {
					if (
						typeof song === "object" &&
						"song_id" in song &&
						typeof song.song_id === "string"
					) {
						privateSongsToAdd[song.song_id] = song as Song;
					}
				}
				console.warn(
					"[addActivePrivateSongSlugs] Updating store with songs:",
					privateSongsToAdd,
				);
				const storeForOps = appState ?? sliceState;
				storeForOps.addOrUpdatePrivateSongs(privateSongsToAdd);

				// Update activePrivateSongIds to include newly fetched songs
				const newActivePrivateSongIds: ReadonlyArray<string> = [
					...new Set([
						...storeForOps.activePrivateSongIds,
						...Object.keys(privateSongsToAdd),
					]),
				];

				// unsubscribe from previous subscription if exists
				if (typeof storeForOps.activePrivateSongsUnsubscribe === "function") {
					storeForOps.activePrivateSongsUnsubscribe();
				}

				// subscribe to new set
				const activePrivateSongsUnsubscribe =
					storeForOps.subscribeToActivePrivateSongs();

				set(() => ({
					activePrivateSongsUnsubscribe:
						activePrivateSongsUnsubscribe ?? (() => {}),
					activePrivateSongIds: newActivePrivateSongIds,
				}));
			} else {
				console.error("[addActivePrivateSongSlugs] Invalid data format:", data);
			}
		} catch (err) {
			console.error("[addActivePrivateSongIds] Unexpected fetch error:", err);
		}
	};
}
