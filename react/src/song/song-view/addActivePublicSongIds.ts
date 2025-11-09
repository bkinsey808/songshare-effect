// src/features/react/song-subscribe/addActiveSongIds.ts
import { Schema } from "effect";

import { type SongPublic, songPublicSchema } from "../song-schema";
import { type SongSubscribeSlice } from "./songSlice";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import type { AppSlice } from "@/react/zustand/useAppStore";

export default function addActivePublicSongIds(
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
		const newActivePublicSongIds = Array.from(
			new Set([...state.activePublicSongIds, ...songIds]),
		);

		// Update activeSongIds and resubscribe.
		set((prev) => {
			if (typeof prev.activePublicSongsUnsubscribe === "function") {
				prev.activePublicSongsUnsubscribe();
			}
			return { activePublicSongIds: newActivePublicSongIds };
		});

		// Subscribe after activeSongIds is updated in Zustand
		set(() => {
			const activePublicSongsUnsubscribe = state.subscribeToActivePublicSongs();
			return {
				activePublicSongsUnsubscribe:
					activePublicSongsUnsubscribe ?? (() => {}),
			};
		});

		if (newActivePublicSongIds.length === 0) {
			// eslint-disable-next-line no-console
			console.log("[addActivePublicSongIds] No active songs to fetch.");
			return;
		}

		const visitorToken = (state as unknown as { visitorToken?: string })
			.visitorToken;
		if (typeof visitorToken !== "string") {
			console.warn(
				"[addActivePublicSongIds] No visitor token found. Cannot fetch songs.",
			);
			return;
		}

		const supabase = getSupabaseClient(visitorToken);
		if (supabase === undefined) {
			console.warn("[addActivePublicSongIds] Supabase client not initialized.");
			return;
		}

		// Fire-and-forget async function to fetch all active song data
		void (async () => {
			// eslint-disable-next-line no-console
			console.log(
				"[addActivePublicSongIds] Fetching active songs:",
				newActivePublicSongIds,
			);
			try {
				const { data, error } = await supabase
					.from("song_public")
					.select("*")
					.in("song_id", newActivePublicSongIds);

				if (error !== null) {
					console.error(
						"[addActivePublicSongIds] Supabase fetch error:",
						error,
					);
					return;
				}

				console.warn("[addActivePublicSongIds] Fetched data:", data);

				// Simple validation using Effect schema
				if (Array.isArray(data)) {
					const publicSongsToAdd: Record<string, SongPublic> = {};

					for (const song of data) {
						if (
							typeof song === "object" &&
							"song_id" in song &&
							typeof song.song_id === "string"
						) {
							// Use Effect schema to safely decode the song data
							const decodeResult =
								Schema.decodeUnknownEither(songPublicSchema)(song);

							if (decodeResult._tag === "Right") {
								// Successfully decoded
								publicSongsToAdd[song.song_id] = decodeResult.right;
							} else {
								// Failed to decode, log the error and skip this song
								console.warn(
									`[addActivePublicSongIds] Failed to decode song ${song.song_id}:`,
									decodeResult.left,
								);
							}
						}
					}
					console.warn(
						"[addActiveSongIds] Updating store with songs:",
						publicSongsToAdd,
					);
					state.addOrUpdatePublicSongs(publicSongsToAdd);
				} else {
					console.error("[addActivePublicSongIds] Invalid data format:", data);
				}
			} catch (err) {
				console.error("[addActivePublicSongIds] Unexpected fetch error:", err);
			}
		})();
	};
}
