// src/features/react/song-subscribe/addActiveSongIds.ts
import { type SongSubscribeSlice } from "./songSlice";
import { decodeSongData } from "./utils/decodeSongData";
import { fetchPublicSongsBySlugs } from "./utils/fetchPublicSongsBySlugs";
import { findMissingSongSlugs } from "./utils/findMissingSongSlugs";
import { updateStoreWithPublicSongs } from "./utils/updateStoreWithPublicSongs";
import { validateVisitorToken } from "./utils/validateVisitorToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import type { AppSlice } from "@/react/zustand/useAppStore";

export default function addActivePublicSongSlugs(
	set: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((state: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return async (songSlugs: string[]): Promise<void> => {
		const state = get() as SongSubscribeSlice & AppSlice;

		// Find missing song slugs that are not already being subscribed to
		const missingSongSlugs = findMissingSongSlugs({
			songSlugs,
			activePublicSongIds: state.activePublicSongIds,
			publicSongs: state.publicSongs,
		});

		if (missingSongSlugs.length === 0) {
			// eslint-disable-next-line no-console
			console.log(
				"[addActivePublicSongSlugs] All song slugs already active, nothing to do.",
			);
			return;
		}

		// Validate visitor token
		const visitorToken = (state as unknown as { visitorToken?: string })
			.visitorToken;
		if (!validateVisitorToken(visitorToken)) {
			return;
		}

		// Get Supabase client
		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn(
				"[addActivePublicSongSlugs] Supabase client not initialized.",
			);
			return;
		}

		// Fetch songs from Supabase
		const { data, error } = await fetchPublicSongsBySlugs(
			supabase,
			missingSongSlugs,
		);

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
