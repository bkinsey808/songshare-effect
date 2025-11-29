import { type Set, type Get, type Api } from "@/react/zustand/slice-utils";
import { sliceResetFns } from "@/react/zustand/useAppStore";
import { safeGet } from "@/shared/utils/safe";

import { type Song, type SongPublic } from "../song-schema";
import addActivePrivateSongIds from "./addActivePrivateSongIds";
import addActivePrivateSongSlugs from "./addActivePrivateSongSlugs";
import addActivePublicSongIds from "./addActivePublicSongIds";
import addActivePublicSongSlugs from "./addActivePublicSongSlugs";
import subscribeToActivePrivateSongs from "./subscribeToActivePrivateSongs";
import subscribeToActivePublicSongs from "./subscribeToActivePublicSongs";

type SongSubscribeState = {
	privateSongs: Record<string, Song>;
	publicSongs: Record<string, SongPublic>;
	activePrivateSongIds: ReadonlyArray<string>;
	activePublicSongIds: ReadonlyArray<string>;
};

export type SongSubscribeSlice = SongSubscribeState & {
	/** Add or update song records. Never removes any songs from the store. */
	addOrUpdatePrivateSongs: (songs: Readonly<Record<string, Song>>) => void;
	addOrUpdatePublicSongs: (songs: Readonly<Record<string, SongPublic>>) => void;
	/** Add songIds to the set of active songs. Never removes any songs from the store. */
	addActivePrivateSongIds: (songIds: ReadonlyArray<string>) => void;
	addActivePublicSongIds: (songIds: ReadonlyArray<string>) => void;
	addActivePrivateSongSlugs: (
		songSlugs: ReadonlyArray<string>,
	) => Promise<void>;
	addActivePublicSongSlugs: (songSlugs: ReadonlyArray<string>) => Promise<void>;
	/** Remove songIds from the set of active songs. Never removes any songs from the store. */
	removeActivePrivateSongIds: (songIds: ReadonlyArray<string>) => void;
	removeActivePublicSongIds: (songIds: ReadonlyArray<string>) => void;
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

const initialState: SongSubscribeState = {
	privateSongs: {} as Record<string, Song>,
	publicSongs: {} as Record<string, SongPublic>,
	activePrivateSongIds: [] as ReadonlyArray<string>,
	activePublicSongIds: [] as ReadonlyArray<string>,
};

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
		addOrUpdatePublicSongs: (
			publicSongs: Readonly<Record<string, SongPublic>>,
		) => {
			set((state) => ({
				publicSongs: { ...state.publicSongs, ...publicSongs },
			}));
		},

		addActivePrivateSongIds: addActivePrivateSongIds(set, get),
		addActivePublicSongIds: addActivePublicSongIds(set, get),
		addActivePrivateSongSlugs: addActivePrivateSongSlugs(set, get),
		addActivePublicSongSlugs: addActivePublicSongSlugs(set, get),

		removeActivePrivateSongIds: (songIds: ReadonlyArray<string>) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePrivateSongsUnsubscribe) {
					state.activePrivateSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePrivateSongIds: ReadonlyArray<string> =
					state.activePrivateSongIds.filter((id) => !songIds.includes(id));
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
		removeActivePublicSongIds: (songIds: ReadonlyArray<string>) => {
			set((state) => {
				// Unsubscribe from previous subscription if exists
				if (state.activePublicSongsUnsubscribe) {
					state.activePublicSongsUnsubscribe();
				}
				// Update activeSongIds
				const newActivePublicSongIds: ReadonlyArray<string> =
					state.activePublicSongIds.filter((id) => !songIds.includes(id));
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
