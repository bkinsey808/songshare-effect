import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import callSelect from "@/react/supabase/client/safe-query/callSelect";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

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
	return (songIds: readonly string[]): Effect.Effect<void, Error> => {
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

		if (newActivePrivateSongIds.length === NO_ACTIVE_SONGS_COUNT) {
			console.warn("[addActivePrivateSongIds] No active songs to fetch.");
			return Effect.void;
		}

		// Return Effect that completes when fetch finishes
		return Effect.gen(function* addActivePrivateSongIdsGen($) {
			// Get authentication token (handles both user and visitor tokens automatically)
			const authToken = yield* $(
				Effect.tryPromise({
					try: () => getSupabaseAuthToken(),
					catch: (err) => new Error(`Failed to get auth token: ${String(err)}`),
				}),
			);

			if (typeof authToken !== "string") {
				console.warn("[addActivePrivateSongIds] No auth token found. Cannot fetch songs.");
				return;
			}

			const supabase = getSupabaseClient(authToken);
			if (supabase === undefined) {
				console.warn("[addActivePrivateSongIds] Supabase client not initialized.");
				return;
			}

			console.warn("[addActivePrivateSongIds] Fetching active songs:", newActivePrivateSongIds);

			const songQueryRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(supabase, "song", {
							cols: "*",
							in: { col: "song_id", vals: [...newActivePrivateSongIds] },
						}),
					catch: (err) => new Error(`Failed to fetch songs: ${String(err)}`),
				}),
			);

			if (!isRecord(songQueryRes)) {
				console.error("[addActivePrivateSongIds] Supabase fetch error:", songQueryRes);
				return;
			}

			const data = Array.isArray(songQueryRes["data"]) ? songQueryRes["data"] : [];
			console.warn("[addActivePrivateSongIds] Fetched data:", data);

			// Simple validation assuming the data structure is correct
			if (Array.isArray(data)) {
				const privateSongsToAdd: Record<string, Song> = {};

				for (const song of data) {
					if (isSongRow(song)) {
						privateSongsToAdd[song.song_id] = song;
					}
				}

				console.warn("[addActiveSongIds] Updating store with songs:", privateSongsToAdd);
				yield* $(
					Effect.sync(() => {
						const storeForOps = sliceState;
						storeForOps.addOrUpdatePrivateSongs(privateSongsToAdd);
					}),
				);
			} else {
				console.error("[addActivePrivateSongIds] Invalid data format:", data);
			}
		});
	};
}
