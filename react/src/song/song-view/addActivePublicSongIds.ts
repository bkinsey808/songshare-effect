// src/features/react/song-subscribe/addActiveSongIds.ts
import { Schema } from "effect";

import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { getStoreApi } from "@/react/zustand/useAppStore";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

import { type SongPublic, songPublicSchema } from "../song-schema";
import { type SongSubscribeSlice } from "./song-slice";

export default function addActivePublicSongIds(
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
		// Prefer the global store API when available so we can read the full
		// `AppSlice` shape without unsafe assertions. Fall back to the local
		// `get()` accessor when the store API is not yet available.
		const storeApi = getStoreApi();
		const appState = storeApi ? storeApi.getState() : undefined;
		const sliceState = get();

		// Compute the previous active IDs from whichever state we have.
		const prevActiveIds: ReadonlyArray<string> = appState
			? appState.activePublicSongIds
			: sliceState.activePublicSongIds;

		const newActivePublicSongIds: ReadonlyArray<string> = Array.from(
			new Set([...prevActiveIds, ...songIds]),
		);

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePublicSongsUnsubscribe === "function") {
				prev.activePublicSongsUnsubscribe();
			}
			return { activePublicSongIds: newActivePublicSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set(() => {
			const storeForOps = appState ?? sliceState;
			const activePublicSongsUnsubscribe =
				storeForOps.subscribeToActivePublicSongs();
			return {
				activePublicSongsUnsubscribe:
					activePublicSongsUnsubscribe ?? (() => undefined),
			};
		});

		const NO_ACTIVE_SONGS = 0;

		if (newActivePublicSongIds.length === NO_ACTIVE_SONGS) {
			console.warn("[addActivePublicSongIds] No active songs to fetch.");
			return;
		}

		// Read optional visitorToken via the app-level state when available.
		let visitorToken: string | undefined = undefined;
		if (appState) {
			const appStateUnknown: unknown = appState;
			if (isRecord(appStateUnknown)) {
				const { visitorToken: vt } = appStateUnknown;
				if (typeof vt === "string") {
					visitorToken = vt;
				}
			}
		}

		if (typeof visitorToken !== "string") {
			console.warn(
				"[addActivePublicSongIds] No visitor token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn("[addActivePublicSongIds] Supabase client not initialized.");
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async () => {
			console.warn(
				"[addActivePublicSongIds] Fetching active songs:",
				newActivePublicSongIds,
			);
			try {
				const { data, error } = await supabase
					.from("song_public")
					.select("*")
					.in("song_id", newActivePublicSongIds);

				if (error !== null) {
					console.error(
						"[addActivePublicSongIds] Supabase fetch error:",
						error,
					);
					return;
				}

				console.warn("[addActivePublicSongIds] Fetched data:", data);

				// Simple validation using Effect schema
				if (Array.isArray(data)) {
					const publicSongsToAdd: Record<string, SongPublic> = {};

					for (const song of data) {
						if (
							typeof song === "object" &&
							"song_id" in song &&
							typeof song.song_id === "string"
						) {
							// Use Effect schema to safely decode the song data
							const decodeResult =
								Schema.decodeUnknownEither(songPublicSchema)(song);

							if (decodeResult._tag === "Right") {
								// Successfully decoded
								publicSongsToAdd[song.song_id] = decodeResult.right;
							} else {
								// Failed to decode, log the error and skip this song
								console.warn(
									`[addActivePublicSongIds] Failed to decode song ${song.song_id}:`,
									decodeResult.left,
								);
							}
						}
					}
					console.warn(
						"[addActiveSongIds] Updating store with songs:",
						publicSongsToAdd,
					);
					const storeForOps = appState ?? sliceState;
					storeForOps.addOrUpdatePublicSongs(publicSongsToAdd);
				} else {
					console.error("[addActivePublicSongIds] Invalid data format:", data);
				}
			} catch (err) {
				console.error("[addActivePublicSongIds] Unexpected fetch error:", err);
			}
		})();
	};
}
