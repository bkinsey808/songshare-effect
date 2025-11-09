// src/features/react/song-subscribe/addActiveSongIds.ts
import { type Song } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import type { AppSlice } from "@/react/zustand/useAppStore";

export default function addActivePrivateSongIds(
	set: (
		partial:
			| Partial<SongSubscribeSlice>
			| ((state: Readonly<SongSubscribeSlice>) => Partial<SongSubscribeSlice>),
	) => void,
	get: () => SongSubscribeSlice,
) {
	return (songIds: ReadonlyArray<string>): void => {
		const state = get() as SongSubscribeSlice & AppSlice;
		// Always fetch all activeSongIds (union of previous and new)
		const newActivePrivateSongIds = Array.from(
			new Set([...state.activePrivateSongIds, ...songIds]),
		);

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePrivateSongsUnsubscribe === "function") {
				prev.activePrivateSongsUnsubscribe();
			}
			return { activePrivateSongIds: newActivePrivateSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set(() => {
			const activePrivateSongsUnsubscribe =
				state.subscribeToActivePrivateSongs();
			return {
				activePrivateSongsUnsubscribe:
					activePrivateSongsUnsubscribe ?? (() => {}),
			};
		});

		if (newActivePrivateSongIds.length === 0) {
			// eslint-disable-next-line no-console
			console.log("[addActivePrivateSongIds] No active songs to fetch.");
			return;
		}

		const visitorToken = (state as unknown as { visitorToken?: string })
			.visitorToken;
		if (typeof visitorToken !== "string") {
			console.warn(
				"[addActivePrivateSongIds] No visitor token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn(
				"[addActivePrivateSongIds] Supabase client not initialized.",
			);
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async () => {
			// eslint-disable-next-line no-console
			console.log(
				"[addActivePrivateSongIds] Fetching active songs:",
				newActivePrivateSongIds,
			);
			try {
				const { data, error } = await supabase
					.from("song")
					.select("*")
					.in("song_id", newActivePrivateSongIds);

				if (error !== null) {
					console.error(
						"[addActivePrivateSongIds] Supabase fetch error:",
						error,
					);
					return;
				}

				console.warn("[addActivePrivateSongIds] Fetched data:", data);

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
						"[addActiveSongIds] Updating store with songs:",
						privateSongsToAdd,
					);
					state.addOrUpdatePrivateSongs(privateSongsToAdd);
				} else {
					console.error("[addActivePrivateSongIds] Invalid data format:", data);
				}
			} catch (err) {
				console.error("[addActivePrivateSongIds] Unexpected fetch error:", err);
			}
		})();
	};
}
