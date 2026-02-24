import { Effect } from "effect";

import type { SongPublic } from "@/react/song/song-schema";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";

import type { SongSubscribeSlice } from "../song-slice/song-slice";

import processSong from "./processSong";

/**
 * Add public songs to the active subscription list by song id. Ensures the
 * store's `activePublicSongIds` contains the provided ids, fetches missing
 * songs from Supabase, and updates the store with decoded results.
 *
 * @param set - Zustand set function for the SongSubscribe slice
 * @param get - Getter for the current slice state
 * @returns An Effect that completes when the fetch and store update finish
 */
export default function addActivePublicSongIds(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: readonly string[]): Effect.Effect<void, Error> => {
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

		// Return Effect that completes when fetch finishes
		return Effect.gen(function* addActivePublicSongIdsGen($) {
			// Get authentication token (handles both user and visitor tokens automatically)
			const authToken = yield* $(
				Effect.tryPromise({
					try: () => getSupabaseAuthToken(),
					catch: (err) => new Error(`Failed to get auth token: ${String(err)}`),
				}),
			);

			if (typeof authToken !== "string") {
				console.warn("[addActivePublicSongIds] No auth token found. Cannot fetch songs.");
				return;
			}

			const supabase = getSupabaseClient(authToken);
			if (supabase === undefined) {
				console.warn("[addActivePublicSongIds] Supabase client not initialized.");
				return;
			}

			console.warn("[addActivePublicSongIds] Fetching active songs:", newActivePublicSongIds);

			const songQueryRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(supabase, "song_public", {
							cols: "*",
							in: { col: "song_id", vals: [...newActivePublicSongIds] },
						}),
					catch: (err) => new Error(`Failed to fetch songs: ${String(err)}`),
				}),
			);

			if (!isRecord(songQueryRes)) {
				console.error("[addActivePublicSongIds] Supabase fetch error:", songQueryRes);
				return;
			}

			const data = Array.isArray(songQueryRes["data"]) ? songQueryRes["data"] : [];
			// Simple validation using Effect schema
			if (Array.isArray(data)) {
				const publicSongsToAdd: Record<string, SongPublic> = {};

				for (const song of data) {
					processSong(song, publicSongsToAdd);
				}

				console.warn("[addActiveSongIds] Updating store with songs:", publicSongsToAdd);
				yield* $(
					Effect.sync(() => {
						const storeForOps = sliceState;
						storeForOps.addOrUpdatePublicSongs(publicSongsToAdd);
					}),
				);
			} else {
				console.error("[addActivePublicSongIds] Invalid data format:", data);
			}
		});
	};
}
