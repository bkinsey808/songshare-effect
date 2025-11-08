// src/features/react/song-subscribe/slice.ts
import type { StateCreator } from "zustand";

import { type Song, type SongPublic } from "../song-schema";
import addActivePrivateSongIds from "./addActivePrivateSongIds";
import addActivePrivateSongSlugs from "./addActivePrivateSongSlugs";
import addActivePublicSongIds from "./addActivePublicSongIds";
import addActivePublicSongSlugs from "./addActivePublicSongSlugs";
import subscribeToActivePrivateSongs from "./subscribeToActivePrivateSongs";
import subscribeToActivePublicSongs from "./subscribeToActivePublicSongs";
import { sliceResetFns } from "@/react/zustand/useAppStore";
import { safeGet } from "@/shared/utils/safe";

export type SongSubscribeSlice = {
	privateSongs: Record<string, Song>;
	publicSongs: Record<string, SongPublic>;
	activePrivateSongIds: string[];
	activePublicSongIds: string[];
	/** Add or update song records. Never removes any songs from the store. */
	addOrUpdatePrivateSongs: (songs: Record<string, Song>) => void;
	addOrUpdatePublicSongs: (songs: Record<string, SongPublic>) => void;
	/** Add songIds to the set of active songs. Never removes any songs from the store. */
	addActivePrivateSongIds: (songIds: string[]) => void;
	addActivePublicSongIds: (songIds: string[]) => void;
	addActivePrivateSongSlugs: (songSlugs: string[]) => Promise<void>;
	addActivePublicSongSlugs: (songSlugs: string[]) => Promise<void>;
	/** Remove songIds from the set of active songs. Never removes any songs from the store. */
	removeActivePrivateSongIds: (songIds: string[]) => void;
	removeActivePublicSongIds: (songIds: string[]) => void;
	/** Subscribes to realtime updates for the current activeSongIds. Returns an unsubscribe function. */
	subscribeToActivePrivateSongs: () => (() => void) | undefined;
	subscribeToActivePublicSongs: () => (() => void) | undefined;
	/** Internal: holds the current unsubscribe function for the realtime subscription. */
	activePrivateSongsUnsubscribe?: () => void;
	activePublicSongsUnsubscribe?: () => void;
	/** Returns the song object (private or public) by song_slug */
	getSongBySlug: (
		slug: string,
	) =>
		| { song: Song | undefined; songPublic: SongPublic | undefined }
		| undefined;
};

const initialState = {
	privateSongs: {} as Record<string, Song>,
	publicSongs: {} as Record<string, SongPublic>,
	activePrivateSongIds: [],
	activePublicSongIds: [],
};

export const createSongSubscribeSlice: StateCreator<
	SongSubscribeSlice,
	[["zustand/devtools", never]],
	[],
	SongSubscribeSlice
> = (set, get) => {
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		addOrUpdatePrivateSongs: (songs: Record<string, Song>) => {
			set((state) => ({
				privateSongs: { ...state.privateSongs, ...songs },
			}));
		},
		addOrUpdatePublicSongs: (publicSongs: Record<string, SongPublic>) => {
			set((state) => ({
				publicSongs: { ...state.publicSongs, ...publicSongs },
			}));
		},

		addActivePrivateSongIds: addActivePrivateSongIds(set, get),
		addActivePublicSongIds: addActivePublicSongIds(set, get),
		addActivePrivateSongSlugs: addActivePrivateSongSlugs(set, get),
		addActivePublicSongSlugs: addActivePublicSongSlugs(set, get),

		removeActivePrivateSongIds: (songIds: string[]) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePrivateSongsUnsubscribe) {
					state.activePrivateSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePrivateSongIds = state.activePrivateSongIds.filter(
					(id) => !songIds.includes(id),
				);
				// Subscribe to new set
				const activePrivateSongsUnsubscribe = subscribeToActivePrivateSongs(
					set,
					get,
				);
				return {
					activePrivateSongIds: newActivePrivateSongIds,
					activePrivateSongsUnsubscribe,
				};
			});
		},
		removeActivePublicSongIds: (songIds: string[]) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePublicSongsUnsubscribe) {
					state.activePublicSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePublicSongIds = state.activePublicSongIds.filter(
					(id) => !songIds.includes(id),
				);
				// Subscribe to new set
				const activePublicSongsUnsubscribe = subscribeToActivePublicSongs(
					set,
					get,
				);
				return {
					activePublicSongIds: newActivePublicSongIds,
					activePublicSongsUnsubscribe,
				};
			});
		},

		subscribeToActivePrivateSongs: subscribeToActivePrivateSongs(set, get),
		subscribeToActivePublicSongs: subscribeToActivePublicSongs(set, get),

		getSongBySlug: (slug: string) => {
			const allPublicSongs = get().publicSongs;

			for (const songId of Object.keys(allPublicSongs)) {
				const songPublic = safeGet(allPublicSongs, songId) as unknown;
				if (
					typeof songPublic === "object" &&
					songPublic !== null &&
					"song_slug" in songPublic &&
					"song_id" in songPublic &&
					songPublic.song_slug === slug
				) {
					// Extract the song_id safely
					const songIdValue = (songPublic as { song_id: string }).song_id;
					const song = safeGet(get().privateSongs, songIdValue) as
						| Song
						| undefined;
					return { song, songPublic: songPublic as SongPublic };
				}
			}

			return undefined;
		},
	};
};
