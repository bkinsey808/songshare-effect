import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

// src/features/react/song-subscribe/addActiveSongIds.ts
import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./song-slice";

export default function addActivePrivateSongIds(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: readonly string[]): void => {
		// Prefer the slice state for previous active IDs (avoids cross-module dependency).
		const sliceState = get();
		const prevActiveIds: readonly string[] = sliceState.activePrivateSongIds;

		const newActivePrivateSongIds: readonly string[] = [...new Set([...prevActiveIds, ...songIds])];

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePrivateSongsUnsubscribe === "function") {
				prev.activePrivateSongsUnsubscribe();
			}
			return { activePrivateSongIds: newActivePrivateSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set(() => {
			const storeForOps = sliceState;
			const activePrivateSongsUnsubscribe = storeForOps.subscribeToActivePrivateSongs();
			return {
				// Keep undefined rather than providing an empty function.
				// Consumers check typeof === 'function' before calling.
				// Return a non-empty no-op fallback so the property is always a function
				// (matching the declared slice type) and avoids the `no-empty-function` rule.
				activePrivateSongsUnsubscribe: activePrivateSongsUnsubscribe ?? ((): void => undefined),
			};
		});
		const NO_ACTIVE_SONGS_COUNT = 0;

		if (newActivePrivateSongIds.length === NO_ACTIVE_SONGS_COUNT) {
			console.warn("[addActivePrivateSongIds] No active songs to fetch.");
			return;
		}

		// Read optional visitorToken from the slice state when available.
		let visitorToken: string | undefined = undefined;
		const sliceStateUnknown: unknown = sliceState;
		if (isRecord(sliceStateUnknown)) {
			const { visitorToken: vt } = sliceStateUnknown as {
				visitorToken?: unknown;
			};
			if (typeof vt === "string") {
				visitorToken = vt;
			}
		}

		if (typeof visitorToken !== "string") {
			console.warn("[addActivePrivateSongIds] No visitor token found. Cannot fetch songs.");
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn("[addActivePrivateSongIds] Supabase client not initialized.");
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async (): Promise<void> => {
			console.warn("[addActivePrivateSongIds] Fetching active songs:", newActivePrivateSongIds);
			try {
				const { data, error } = await supabase
					.from("song")
					.select("*")
					.in("song_id", newActivePrivateSongIds);

				if (error !== null) {
					console.error("[addActivePrivateSongIds] Supabase fetch error:", error);
					return;
				}

				console.warn("[addActivePrivateSongIds] Fetched data:", data);

				// Simple validation assuming the data structure is correct
				if (Array.isArray(data)) {
					const privateSongsToAdd: Record<string, Song> = {};

					for (const song of data) {
						if (typeof song === "object" && "song_id" in song && typeof song.song_id === "string") {
							privateSongsToAdd[song.song_id] = song as Song;
						}
					}
					console.warn("[addActiveSongIds] Updating store with songs:", privateSongsToAdd);
					const storeForOps = sliceState;
					storeForOps.addOrUpdatePrivateSongs(privateSongsToAdd);
				} else {
					console.error("[addActivePrivateSongIds] Invalid data format:", data);
				}
			} catch (error) {
				console.error("[addActivePrivateSongIds] Unexpected fetch error:", error);
			}
		})();
	};
}
