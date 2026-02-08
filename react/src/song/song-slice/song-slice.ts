import type { Effect } from "effect";

import { type Api, type Get, type Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import { safeGet } from "@/shared/utils/safe";

import addActivePrivateSongIds from "../active-songs/addActivePrivateSongIds";
import addActivePrivateSongSlugs from "../active-songs/addActivePrivateSongSlugs";
import addActivePublicSongIds from "../active-songs/addActivePublicSongIds";
import addActivePublicSongSlugs from "../active-songs/addActivePublicSongSlugs";
import subscribeToActivePrivateSongs from "../active-songs/subscribeToActivePrivateSongs";
import subscribeToActivePublicSongs from "../active-songs/subscribeToActivePublicSongs";
import { type Song, type SongPublic } from "../song-schema";

type SongSubscribeState = {
	privateSongs: Record<string, Song>;
	publicSongs: Record<string, SongPublic>;
	activePrivateSongIds: readonly string[];
	activePublicSongIds: readonly string[];
};

const initialState: SongSubscribeState = {
	privateSongs: {} as Record<string, Song>,
	publicSongs: {} as Record<string, SongPublic>,
	activePrivateSongIds: [] as readonly string[],
	activePublicSongIds: [] as readonly string[],
};

export type SongSubscribeSlice = SongSubscribeState & {
	/** Add or update song records. Never removes any songs from the store. */
	addOrUpdatePrivateSongs: (songs: Readonly<Record<string, Song>>) => void;
	addOrUpdatePublicSongs: (songs: Readonly<Record<string, SongPublic>>) => void;
	/** Add songIds to the set of active songs. Never removes any songs from the store. */
	addActivePrivateSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error>;
	addActivePrivateSongSlugs: (songSlugs: readonly string[]) => Promise<void>;
	addActivePublicSongSlugs: (songSlugs: readonly string[]) => Promise<void>;
	/** Remove songIds from the set of active songs. Never removes any songs from the store. */
	removeActivePrivateSongIds: (songIds: readonly string[]) => void;
	removeActivePublicSongIds: (songIds: readonly string[]) => void;
	/** Remove songs from the in-memory and persisted cache (e.g. after delete). */
	removeSongsFromCache: (songIds: readonly string[]) => void;
	/** Subscribes to realtime updates for the current activeSongIds. Returns an unsubscribe function. */
	subscribeToActivePrivateSongs: () => (() => void) | undefined;
	subscribeToActivePublicSongs: () => (() => void) | undefined;
	/** Internal: holds the current unsubscribe function for the realtime subscription. */
	activePrivateSongsUnsubscribe?: () => void;
	activePublicSongsUnsubscribe?: () => void;
	/** Returns the song object (private or public) by song_slug */
	getSongBySlug: (
		slug: string,
	) => { song: Song | undefined; songPublic: SongPublic | undefined } | undefined;
};

/**
 * Create the song subscription slice for the global store. Provides methods
 * to manage private/public song caches, active song id lists, and realtime
 * subscription lifecycle handlers.
 *
 * @param set - Zustand set function scoped to this slice
 * @param get - Getter for current slice state
 * @param api - Optional store API (kept for middleware/consumers)
 * @returns The initialized SongSubscribeSlice with helper methods
 */
export function createSongSubscribeSlice(
	set: Set<SongSubscribeSlice>,
	get: Get<SongSubscribeSlice>,
	api: Api<SongSubscribeSlice>,
): SongSubscribeSlice {
	// Keep the `api` parameter in the signature so callers can pass the Zustand
	// StoreApi (middleware may supply it). Mark it used to avoid unused param
	// compile errors when the slice implementation doesn't need it.
	void api;
	// `set` and `get` are typed to include `AppSlice` via the StateCreator generic above,
	// so we can pass them directly to helper factories without unsafe assertions.
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		addOrUpdatePrivateSongs: (songs: Readonly<Record<string, Song>>) => {
			set((state) => ({
				privateSongs: { ...state.privateSongs, ...songs },
			}));
		},
		addOrUpdatePublicSongs: (publicSongs: Readonly<Record<string, SongPublic>>) => {
			set((state) => ({
				publicSongs: { ...state.publicSongs, ...publicSongs },
			}));
		},

		addActivePrivateSongIds: addActivePrivateSongIds(set, get),
		addActivePublicSongIds: addActivePublicSongIds(set, get),
		addActivePrivateSongSlugs: addActivePrivateSongSlugs(set, get),
		addActivePublicSongSlugs: addActivePublicSongSlugs(set, get),

		removeActivePrivateSongIds: (songIds: readonly string[]) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePrivateSongsUnsubscribe) {
					state.activePrivateSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePrivateSongIds: readonly string[] = state.activePrivateSongIds.filter(
					(id) => !songIds.includes(id),
				);
				// Subscribe to new set
				const activePrivateSongsUnsubscribe = subscribeToActivePrivateSongs(set, get) as () =>
					| (() => void)
					| undefined;
				return {
					activePrivateSongIds: newActivePrivateSongIds,
					activePrivateSongsUnsubscribe,
				};
			});
		},
		removeActivePublicSongIds: (songIds: readonly string[]) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePublicSongsUnsubscribe) {
					state.activePublicSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePublicSongIds: readonly string[] = state.activePublicSongIds.filter(
					(id) => !songIds.includes(id),
				);
				// Subscribe to new set
				const activePublicSongsUnsubscribe = subscribeToActivePublicSongs(set, get) as () =>
					| (() => void)
					| undefined;
				return {
					activePublicSongIds: newActivePublicSongIds,
					activePublicSongsUnsubscribe,
				};
			});
		},

		removeSongsFromCache: (songIds: readonly string[]) => {
			const toRemove = new Set(songIds);
			set((state) => ({
				privateSongs: Object.fromEntries(
					Object.entries(state.privateSongs).filter(([id]) => !toRemove.has(id)),
				) as Record<string, Song>,
				publicSongs: Object.fromEntries(
					Object.entries(state.publicSongs).filter(([id]) => !toRemove.has(id)),
				) as Record<string, SongPublic>,
			}));
		},

		subscribeToActivePrivateSongs: subscribeToActivePrivateSongs(set, get) as () =>
			| (() => void)
			| undefined,
		subscribeToActivePublicSongs: subscribeToActivePublicSongs(set, get) as () =>
			| (() => void)
			| undefined,

		getSongBySlug: (slug: string) => {
			const allPublicSongs = get().publicSongs;

			for (const songId of Object.keys(allPublicSongs)) {
				const songPublic = safeGet(allPublicSongs, songId);
				if (
					songPublic &&
					typeof songPublic === "object" &&
					songPublic !== null &&
					Object.hasOwn(songPublic, "song_slug") &&
					typeof songPublic["song_slug"] === "string" &&
					Object.hasOwn(songPublic, "song_id") &&
					typeof songPublic["song_id"] === "string" &&
					songPublic.song_slug === slug
				) {
					const song = safeGet(get().privateSongs, songPublic.song_id);
					return { song, songPublic };
				}
			}

			return undefined;
		},
	};
}
