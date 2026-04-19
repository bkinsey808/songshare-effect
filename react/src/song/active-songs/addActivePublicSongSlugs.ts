import type { Get } from "@/react/app-store/app-store-types";
import getSupabaseClientToken from "@/react/lib/supabase/auth-token/getSupabaseClientToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type { SongSubscribeSlice } from "../song-slice/song-slice";
import decodeSongData from "./decodeSongData";
import fetchPublicSongsBySlugs from "./fetchPublicSongsBySlugs";
import findMissingSongSlugs from "./findMissingSongSlugs";
import getCachedPublicSongsToActivate from "./getCachedPublicSongsToActivate";
import updateStoreWithPublicSongs from "./updateStoreWithPublicSongs";

/**
 * Add public songs to the active subscription list by slug. Fetches missing
 * songs from Supabase and updates the store with decoded results.
 *
 * @param set - Zustand set function for the SongSubscribe slice
 * @param get - Getter for current slice state
 * @returns A function accepting an array of song slugs and fetching them
 */
export default function addActivePublicSongSlugs(
	set: (
		partial:
			| Partial<ReadonlyDeep<SongSubscribeSlice>>
			| ((state: ReadonlyDeep<SongSubscribeSlice>) => Partial<ReadonlyDeep<SongSubscribeSlice>>),
	) => void,
	get: Get<SongSubscribeSlice>,
) {
	return async (songSlugs: readonly string[]): Promise<void> => {
		const state = get();
		const cachedPublicSongsToActivate = getCachedPublicSongsToActivate(state, songSlugs);
		const NO_CACHED_PUBLIC_SONGS_TO_ACTIVATE = 0;

		if (Object.keys(cachedPublicSongsToActivate).length > NO_CACHED_PUBLIC_SONGS_TO_ACTIVATE) {
			updateStoreWithPublicSongs({
				publicSongsToAdd: cachedPublicSongsToActivate,
				state,
				set,
			});
		}

		const refreshedState = get();

		// Find missing song slugs that are not already being subscribed to
		const missingSongSlugs = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: refreshedState.activePublicSongIds,
			publicSongs: refreshedState.publicSongs,
		});

		const NO_MISSING_SONGS = 0;

		if (missingSongSlugs.length === NO_MISSING_SONGS) {
			// Subscription is not persisted. After a page reload activePublicSongIds
			// may already have entries but no live Supabase channel exists.
			const NO_ACTIVE_PUBLIC_SONG_IDS = 0;
			if (
				refreshedState.activePublicSongIds.length > NO_ACTIVE_PUBLIC_SONG_IDS &&
				typeof refreshedState.activePublicSongsUnsubscribe !== "function"
			) {
				const unsub = refreshedState.subscribeToActivePublicSongs();
				set({ activePublicSongsUnsubscribe: unsub ?? ((): undefined => undefined) });
			}
			return;
		}

		// Fetch visitor token to authenticate the Supabase client
		const visitorToken = await getSupabaseClientToken().catch((error: unknown) => {
			console.warn(
				"[addActivePublicSongSlugs] Could not obtain visitor token. Cannot fetch songs.",
				error,
			);
			return undefined;
		});
		if (visitorToken === undefined) {
			return;
		}

		// Get Supabase client
		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn("[addActivePublicSongSlugs] Supabase client not initialized.");
			return;
		}

		// Fetch songs from Supabase
		const { data, error } = await fetchPublicSongsBySlugs(supabase, missingSongSlugs);

		if (error !== undefined || data === undefined) {
			return;
		}

		// Decode and validate song data
		const publicSongsToAdd = decodeSongData(data);

		// Update store with new songs
		updateStoreWithPublicSongs({
			publicSongsToAdd,
			state: refreshedState,
			set,
		});
	};
}
