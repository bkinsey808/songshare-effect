import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { getStoreApi } from "@/react/zustand/useAppStore";
import { isRecord } from "@/shared/utils/typeGuards";

// src/features/react/song-subscribe/addActiveSongIds.ts
import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";

export default function addActivePrivateSongIds(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((
					state: ReadonlyDeep<SongSubscribeSlice>,
			  ) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: ReadonlyArray<string>): void => {
		const storeApi = getStoreApi();
		const appState = storeApi ? storeApi.getState() : undefined;
		const sliceState = get();

		// Compute the previous active IDs from whichever state we have.
		const prevActiveIds: ReadonlyArray<string> = appState
			? appState.activePrivateSongIds
			: sliceState.activePrivateSongIds;

		const newActivePrivateSongIds: ReadonlyArray<string> = Array.from(
			new Set([...prevActiveIds, ...songIds]),
		);

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePrivateSongsUnsubscribe === "function") {
				prev.activePrivateSongsUnsubscribe();
			}
			return { activePrivateSongIds: newActivePrivateSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set(() => {
			const storeForOps = appState ?? sliceState;
			const activePrivateSongsUnsubscribe =
				storeForOps.subscribeToActivePrivateSongs();
			return {
				activePrivateSongsUnsubscribe:
					activePrivateSongsUnsubscribe ?? (() => {}),
			};
		});

		if (newActivePrivateSongIds.length === 0) {
			console.log("[addActivePrivateSongIds] No active songs to fetch.");
			return;
		}

		// Read optional visitorToken via the app-level state when available.
		let visitorToken: string | undefined;
		if (appState) {
			const appStateUnknown: unknown = appState;
			if (
				isRecord(appStateUnknown) &&
				typeof appStateUnknown["visitorToken"] === "string"
			) {
				visitorToken = appStateUnknown["visitorToken"];
			}
		}

		if (typeof visitorToken !== "string") {
			console.warn(
				"[addActivePrivateSongIds] No visitor token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn(
				"[addActivePrivateSongIds] Supabase client not initialized.",
			);
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async () => {
			console.log(
				"[addActivePrivateSongIds] Fetching active songs:",
				newActivePrivateSongIds,
			);
			try {
				const { data, error } = await supabase
					.from("song")
					.select("*")
					.in("song_id", newActivePrivateSongIds);

				if (error !== null) {
					console.error(
						"[addActivePrivateSongIds] Supabase fetch error:",
						error,
					);
					return;
				}

				console.warn("[addActivePrivateSongIds] Fetched data:", data);

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
						"[addActiveSongIds] Updating store with songs:",
						privateSongsToAdd,
					);
					const storeForOps = appState ?? sliceState;
					storeForOps.addOrUpdatePrivateSongs(privateSongsToAdd);
				} else {
					console.error("[addActivePrivateSongIds] Invalid data format:", data);
				}
			} catch (err) {
				console.error("[addActivePrivateSongIds] Unexpected fetch error:", err);
			}
		})();
	};
}
