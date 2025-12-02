import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { type Get } from "@/react/zustand/slice-utils";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";
import { isRecord } from "@/shared/utils/typeGuards";

import { type SongSubscribeSlice } from "./song-slice";
import decodeSongData from "./utils/decodeSongData";
import fetchPublicSongsBySlugs from "./utils/fetchPublicSongsBySlugs";
import findMissingSongSlugs from "./utils/findMissingSongSlugs";
import updateStoreWithPublicSongs from "./utils/updateStoreWithPublicSongs";
import validateVisitorToken from "./utils/validateVisitorToken";

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
