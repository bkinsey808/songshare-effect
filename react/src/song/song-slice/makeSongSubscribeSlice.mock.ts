import { Effect } from "effect";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { Song, SongPublic } from "../song-schema";
import type { SongSubscribeSlice } from "./song-slice";

/**
 * Return a getter for a minimal, test-friendly SongSubscribeSlice.
 * The getter exposes stateful behavior and vi.fn spies so tests can assert
 * against `slice` state after actions run.
 */
export default function makeSongSubscribeSlice({
	initialPrivate = {},
	initialPublic = {},
	initialActivePrivateSongIds = [],
	initialActivePublicSongIds = [],
}: {
	initialPrivate?: Record<string, Song>;
	initialPublic?: Record<string, SongPublic>;
	initialActivePrivateSongIds?: readonly string[];
	initialActivePublicSongIds?: readonly string[];
} = {}): () => SongSubscribeSlice {
	const state = {
		privateSongs: initialPrivate,
		publicSongs: initialPublic,
		activePrivateSongIds: initialActivePrivateSongIds,
		activePublicSongIds: initialActivePublicSongIds,
		activePrivateSongsUnsubscribe: undefined as undefined | (() => void),
		activePublicSongsUnsubscribe: undefined as undefined | (() => void),
	};

	const addOrUpdatePrivateSongs = vi.fn((songs: Record<string, Song>) => {
		state.privateSongs = { ...state.privateSongs, ...songs };
	});

	const addOrUpdatePublicSongs = vi.fn((songs: Record<string, SongPublic>) => {
		state.publicSongs = { ...state.publicSongs, ...songs };
	});

	const addActivePrivateSongIds = vi.fn((ids: readonly string[]) =>
		Effect.sync(() => {
			state.activePrivateSongIds = [...state.activePrivateSongIds, ...ids];
		}),
	);

	const addActivePublicSongIds = vi.fn((ids: readonly string[]) =>
		Effect.sync(() => {
			state.activePublicSongIds = [...state.activePublicSongIds, ...ids];
		}),
	);

	const addActivePrivateSongSlugs = vi.fn(async (_slugs: readonly string[]) => {
		await Promise.resolve();
	});
	const addActivePublicSongSlugs = vi.fn(async (_slugs: readonly string[]) => {
		await Promise.resolve();
	});

	const removeActivePrivateSongIds = vi.fn((ids: readonly string[]) => {
		// call unsubscribe if present
		if (state.activePrivateSongsUnsubscribe) {
			state.activePrivateSongsUnsubscribe();
		}
		state.activePrivateSongIds = state.activePrivateSongIds.filter((id) => !ids.includes(id));
		state.activePrivateSongsUnsubscribe = undefined;
	});

	const removeActivePublicSongIds = vi.fn((ids: readonly string[]) => {
		if (state.activePublicSongsUnsubscribe) {
			state.activePublicSongsUnsubscribe();
		}
		state.activePublicSongIds = state.activePublicSongIds.filter((id) => !ids.includes(id));
		state.activePublicSongsUnsubscribe = undefined;
	});

	const removeSongsFromCache = vi.fn((ids: readonly string[]) => {
		const toRemove = new Set(ids);
		state.privateSongs = Object.fromEntries(
			Object.entries(state.privateSongs).filter(([id]) => !toRemove.has(id)),
		) as Record<string, Song>;
		state.publicSongs = Object.fromEntries(
			Object.entries(state.publicSongs).filter(([id]) => !toRemove.has(id)),
		) as Record<string, SongPublic>;
	});

	const subscribeToActivePrivateSongs = vi.fn(() => {
		// Return an unsubscribe function
		const unsub = vi.fn();
		state.activePrivateSongsUnsubscribe = unsub;
		return unsub;
	});

	const subscribeToActivePublicSongs = vi.fn(() => {
		const unsub = vi.fn();
		state.activePublicSongsUnsubscribe = unsub;
		return unsub;
	});

	const getSongBySlug = vi.fn((slug: string) => {
		for (const songId of Object.keys(state.publicSongs)) {
			const sp = state.publicSongs[songId];
			if (sp?.song_slug === slug) {
				return { song: state.privateSongs[sp.song_id], songPublic: sp };
			}
		}
		return undefined;
	});

	const stub: unknown = {
		get privateSongs() {
			return state.privateSongs;
		},
		get publicSongs() {
			return state.publicSongs;
		},
		get activePrivateSongIds() {
			return state.activePrivateSongIds;
		},
		get activePublicSongIds() {
			return state.activePublicSongIds;
		},

		addOrUpdatePrivateSongs,
		addOrUpdatePublicSongs,
		addActivePrivateSongIds,
		addActivePublicSongIds,
		addActivePrivateSongSlugs,
		addActivePublicSongSlugs,
		removeActivePrivateSongIds,
		removeActivePublicSongIds,
		removeSongsFromCache,
		subscribeToActivePrivateSongs,
		subscribeToActivePublicSongs,
		getSongBySlug,
	};

	return () => forceCast<SongSubscribeSlice>(stub);
}
