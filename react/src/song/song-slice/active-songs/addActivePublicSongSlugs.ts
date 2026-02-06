import type { Get } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import getSupabaseClient from "@/react/supabase/client/getSupabaseClient";
import isRecord from "@/shared/type-guards/isRecord";

import type { SongSubscribeSlice } from "../song-slice";

import decodeSongData from "./decodeSongData";
import fetchPublicSongsBySlugs from "./fetchPublicSongsBySlugs";
import findMissingSongSlugs from "./findMissingSongSlugs";
import updateStoreWithPublicSongs from "./updateStoreWithPublicSongs";
import validateVisitorToken from "./validateVisitorToken";

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

		// Find missing song slugs that are not already being subscribed to
		const missingSongSlugs = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: state.activePublicSongIds,
			publicSongs: state.publicSongs,
		});

		const NO_MISSING_SONGS = 0;

		if (missingSongSlugs.length === NO_MISSING_SONGS) {
			console.warn("[addActivePublicSongSlugs] All song slugs already active, nothing to do.");
			return;
		}

		// Validate visitor token — the token lives on the app-level state in practice
		// but we treat it as an optional unknown here for safety.
		let visitorToken: unknown = undefined;
		if (isRecord(state)) {
			const { visitorToken: vt } = state as Record<string, unknown>;
			visitorToken = vt;
		}
		if (!validateVisitorToken(visitorToken)) {
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
			state,
			set,
		});
	};
}
