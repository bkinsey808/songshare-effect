// src/features/react/song-subscribe/addActiveSongIds.ts
import { Schema } from "effect";

import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

import { type SongPublic, songPublicSchema } from "../song-schema";
import { type SongSubscribeSlice } from "./song-slice";

export default function addActivePublicSongIds(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: readonly string[]): void => {
		// Prefer the global store API when available so we can read the full
		// `AppSlice` shape without unsafe assertions. Fall back to the local
		// `get()` accessor when the store API is not yet available.
		const sliceState = get();

		// Compute the previous active IDs from the slice state.
		const prevActiveIds: readonly string[] = sliceState.activePublicSongIds;

		const newActivePublicSongIds: readonly string[] = [...new Set([...prevActiveIds, ...songIds])];

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePublicSongsUnsubscribe === "function") {
				prev.activePublicSongsUnsubscribe();
			}
			return { activePublicSongIds: newActivePublicSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set((): Partial<ReadonlyDeep<SongSubscribeSlice>> => {
			const storeForOps = sliceState;
			const activePublicSongsUnsubscribe = storeForOps.subscribeToActivePublicSongs();
			return {
				activePublicSongsUnsubscribe: activePublicSongsUnsubscribe ?? (() => undefined),
			};
		});

		// Prefer slice-local token reading — converting to unknown and validating
		// gives us runtime safety without requiring the full `AppSlice` shape.
		let visitorToken: string | undefined = undefined;
		const sliceStateUnknown: unknown = sliceState;
		if (isRecord(sliceStateUnknown)) {
			const { visitorToken: vt } = sliceStateUnknown as { visitorToken?: unknown };
			if (typeof vt === "string") {
				visitorToken = vt;
			}
		}

		if (typeof visitorToken !== "string") {
			console.warn("[addActivePublicSongIds] No visitor token found. Cannot fetch songs.");
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn("[addActivePublicSongIds] Supabase client not initialized.");
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async (): Promise<void> => {
			console.warn("[addActivePublicSongIds] Fetching active songs:", newActivePublicSongIds);

			// helper function lives at the IIFE body root to avoid nested declaration rules
			function processSong(song: unknown, out: Record<string, SongPublic>): void {
				if (!isRecord(song)) {
					return;
				}

				const id = song["song_id"];

				if (typeof id !== "string") {
					return;
				}

				const decodeResult = Schema.decodeUnknownEither(songPublicSchema)(song);

				if (decodeResult._tag !== "Right") {
					console.warn(`[addActivePublicSongIds] Failed to decode song ${id}:`, decodeResult.left);
					return;
				}

				out[id] = decodeResult.right;
			}

			try {
				const { data, error } = await supabase
					.from("song_public")
					.select("*")
					.in("song_id", newActivePublicSongIds);

				if (error !== null) {
					console.error("[addActivePublicSongIds] Supabase fetch error:", error);
					return;
				}

				console.warn("[addActivePublicSongIds] Fetched data:", data);

				// Simple validation using Effect schema
				if (Array.isArray(data)) {
					const publicSongsToAdd: Record<string, SongPublic> = {};

					for (const song of data) {
						processSong(song, publicSongsToAdd);
					}

					console.warn("[addActiveSongIds] Updating store with songs:", publicSongsToAdd);
					const storeForOps = sliceState;
					storeForOps.addOrUpdatePublicSongs(publicSongsToAdd);
				} else {
					console.error("[addActivePublicSongIds] Invalid data format:", data);
				}
			} catch (error) {
				console.error("[addActivePublicSongIds] Unexpected fetch error:", error);
			}
		})();
	};
}
