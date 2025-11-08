// src/features/react/song-subscribe/addActiveSongIds.ts
import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import type { AppSlice } from "@/react/zustand/useAppStore";
import { safeGet } from "@/shared/utils/safe";

export default function addActivePrivateSongSlugs(
	set: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((state: SongSubscribeSlice) => Partial<SongSubscribeSlice>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return async (songSlugs: string[]): Promise<void> => {
		const state = get() as SongSubscribeSlice & AppSlice;

		const currentPublicSongs = state.publicSongs;

		// Find missing song slugs that are not already being subscribed to.
		const activePrivateSongSlugs = new Set(
			state.activePrivateSongIds
				.map((id) => {
					const song = safeGet(currentPublicSongs, id) as unknown;
					return typeof song === "object" &&
						song !== null &&
						"song_slug" in song
						? (song as { song_slug?: string }).song_slug
						: undefined;
				})
				.filter((slug): slug is string => typeof slug === "string"),
		);
		const missingSongSlugs = songSlugs.filter(
			(slug) => !activePrivateSongSlugs.has(slug),
		);
		if (missingSongSlugs.length === 0) {
			// eslint-disable-next-line no-console
			console.log(
				"[addActivePrivateSongSlugs] All song slugs already active, nothing to do.",
			);
			return;
		}

		const userToken = (state as unknown as { userToken?: string }).userToken;
		if (typeof userToken !== "string") {
			console.warn(
				"[addActivePrivateSongSlugs] No user token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(userToken);
		if (supabase === undefined) {
			console.warn(
				"[addActivePrivateSongSlugs] Supabase client not initialized.",
			);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("song")
				.select("*, song_public(song_slug)")
				.in("song_public.song_slug", missingSongSlugs);

			if (error !== null) {
				console.error(
					"[addActivePrivateSongSlugs] Supabase fetch error:",
					error,
				);
				return;
			}

			console.warn("[addActivePrivateSongSlugs] Fetched data:", data);

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
					"[addActivePrivateSongSlugs] Updating store with songs:",
					privateSongsToAdd,
				);
				state.addOrUpdatePrivateSongs(privateSongsToAdd);

				// Update activePrivateSongIds to include newly fetched songs
				const newActivePrivateSongIds = [
					...new Set([
						...state.activePrivateSongIds,
						...Object.keys(privateSongsToAdd),
					]),
				];

				// unsubscribe from previous subscription if exists
				if (typeof state.activePrivateSongsUnsubscribe === "function") {
					state.activePrivateSongsUnsubscribe();
				}

				// subscribe to new set
				const activePrivateSongsUnsubscribe =
					state.subscribeToActivePrivateSongs();

				set(() => ({
					activePrivateSongsUnsubscribe:
						activePrivateSongsUnsubscribe ?? (() => {}),
					activePrivateSongIds: newActivePrivateSongIds,
				}));
			} else {
				console.error("[addActivePrivateSongSlugs] Invalid data format:", data);
			}
		} catch (err) {
			console.error("[addActivePrivateSongIds] Unexpected fetch error:", err);
		}
	};
}
