import { getSupabaseAuthToken } from "@/react/supabase/getSupabaseAuthToken";
import { getSupabaseClient } from "@/react/supabase/supabaseClient";
import { sliceResetFns } from "@/react/zustand/slice-reset-fns";
// Song Library Zustand slice with subscription functionality
// Zustand StateCreator type is not required here — slices are declared as named functions.
import { type Api, type Get, type Set } from "@/react/zustand/slice-utils";
import { type ReadonlyDeep } from "@/shared/types/deep-readonly";

import addSongToSongLibrary from "./addSongToSongLibrary";
import removeSongFromSongLibrary from "./removeSongFromLibrary";
import {
	type AddSongToSongLibraryRequest,
	type RemoveSongFromSongLibraryRequest,
	type SongLibraryEntry,
} from "./song-library-schema";
import { type SongLibrarySliceBase, type SongLibraryState } from "./song-library-types";
import subscribeToSongLibraryFn from "./subscribeToSongLibrary";

const initialState: SongLibraryState = {
	songLibraryEntries: {} as Record<string, SongLibraryEntry>,
	isSongLibraryLoading: false,
	songLibraryError: undefined as string | undefined,
};

const ZERO = 0;

export type SongLibrarySlice = SongLibrarySliceBase & {
	/** Add a song to the user's library */
	addSongToSongLibrary: (request: Readonly<AddSongToSongLibraryRequest>) => Promise<void>;
	/** Remove a song from the user's library */
	removeSongFromSongLibrary: (request: Readonly<RemoveSongFromSongLibraryRequest>) => Promise<void>;
	/** Get all song IDs in the user's library */
	getSongLibrarySongIds: () => string[];
	/** Fetch the user's complete library from the server */
	fetchSongLibrary: () => Promise<void>;

	/** Subscribe to realtime updates for the user's library. Returns an unsubscribe function. */
	subscribeToSongLibrary: () => (() => void) | undefined;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	songLibraryUnsubscribe?: () => void;

	/** Internal actions for updating state from subscriptions */
	setSongLibraryEntries: (entries: ReadonlyDeep<Record<string, SongLibraryEntry>>) => void;
	setSongLibraryLoading: (loading: boolean) => void;
	setSongLibraryError: (error: string | undefined) => void;
	addSongLibraryEntry: (entry: SongLibraryEntry) => void;
	removeSongLibraryEntry: (songId: string) => void;
};

/**
 * Factory that creates the Song Library Zustand slice.
 *
 * This function returns the slice implementation containing public API methods
 * (add/remove/fetch/subscribe) and internal mutation helpers used by
 * subscriptions and optimistic updates. The factory registers a reset handler
 * which will unsubscribe an active realtime subscription, if present, before
 * restoring the initial state.
 *
 * @param set - Zustand `set` function for updating slice state
 * @param get - Zustand `get` function for reading slice state and helpers
 * @param api - Slice `api` object (unused but kept for consistency with other slices)
 * @returns SongLibrarySlice - The initialized slice with public and internal methods
 */
export function createSongLibrarySlice(
	set: Set<SongLibrarySlice>,
	get: Get<SongLibrarySlice>,
	api: Api<SongLibrarySlice>,
): SongLibrarySlice {
	// silence unused param warnings
	void api;
	sliceResetFns.add(() => {
		// Unsubscribe before resetting state
		const { songLibraryUnsubscribe } = get();
		if (songLibraryUnsubscribe) {
			songLibraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		addSongToSongLibrary: async (request: Readonly<AddSongToSongLibraryRequest>) => {
			try {
				await addSongToSongLibrary(request, get);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to add song to song library";
				const { setSongLibraryError } = get();
				setSongLibraryError(errorMessage);
				console.error("[addSongToSongLibrary] Error:", error);
				throw error;
			}
		},
		removeSongFromSongLibrary: async (request: Readonly<RemoveSongFromSongLibraryRequest>) => {
			try {
				await removeSongFromSongLibrary(request, get);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to remove song from song library";
				const { setSongLibraryError } = get();
				setSongLibraryError(errorMessage);
				console.error("[removeSongFromSongLibrary] Error:", error);
				throw error;
			}
		},

		isInSongLibrary: (songId: string) => {
			const { songLibraryEntries } = get();
			return songId in songLibraryEntries;
		},

		getSongLibrarySongIds: () => {
			const { songLibraryEntries } = get();
			return Object.keys(songLibraryEntries);
		},

		fetchSongLibrary: async () => {
			try {
				set({ isSongLibraryLoading: true, songLibraryError: undefined });

				// Supabase utilities (statically imported)
				const userToken = await getSupabaseAuthToken();
				const client = getSupabaseClient(userToken);

				if (!client) {
					throw new Error("No Supabase client available");
				}

				console.warn("[fetchSongLibrary] Fetching song_library entries...");
				const { data, error } = await client.from("song_library").select("*");

				if (error) {
					console.error("[fetchSongLibrary] Error fetching song_library:", error);
					throw error;
				}

				console.warn("[fetchSongLibrary] Received entries:", data?.length ?? ZERO, data);
				const songIds = [...new Set((data ?? []).map((entry) => entry.song_id))];
				console.warn("[fetchSongLibrary] Fetching song_public for song IDs:", songIds);
				const { data: songData, error: songError } = await client
					.from("song_public")
					.select("song_id, song_name, song_slug")
					.in("song_id", songIds);

				if (songError) {
					console.error("[fetchSongLibrary] Error fetching song_public:", songError);
					throw songError;
				}
				console.warn(
					"[fetchSongLibrary] Received song_public data:",
					songData?.length ?? ZERO,
					songData,
				);

				// Create a map of song_id to song details
				const songMap = new Map(
					(songData ?? []).map((song) => [
						song.song_id,
						{ song_name: song.song_name, song_slug: song.song_slug },
					]),
				);

				// Fetch owner usernames for all entries
				const ownerIds = [...new Set((data ?? []).map((entry) => entry.song_owner_id))];
				console.warn("[fetchSongLibrary] Fetching user_public for owner IDs:", ownerIds);
				const { data: ownerData, error: ownerError } = await client
					.from("user_public")
					.select("user_id, username")
					.in("user_id", ownerIds);

				if (ownerError) {
					console.error("[fetchSongLibrary] Error fetching user_public:", ownerError);
					throw ownerError;
				}
				console.warn(
					"[fetchSongLibrary] Received user_public data:",
					ownerData?.length ?? ZERO,
					ownerData,
				);

				// Create a map of owner_id to username
				const ownerMap = new Map((ownerData ?? []).map((owner) => [owner.user_id, owner.username]));

				// Convert array to object indexed by song_id and include owner username and song details
				const entriesRecord = (data ?? []).reduce<Record<string, SongLibraryEntry>>(
					(acc, entry) => {
						const ownerUsername = ownerMap.get(entry.song_owner_id);
						const songDetails = songMap.get(entry.song_id);

						const libraryEntry: SongLibraryEntry = {
							...entry,
							...(ownerUsername !== undefined && {
								owner_username: ownerUsername,
							}),
							...(songDetails !== undefined && {
								song_name: songDetails.song_name,
								song_slug: songDetails.song_slug,
							}),
						};

						acc[entry.song_id] = libraryEntry;
						return acc;
					},
					{},
				);

				set({
					songLibraryEntries: entriesRecord,
					isSongLibraryLoading: false,
					songLibraryError: undefined,
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Failed to fetch library";
				set({
					isSongLibraryLoading: false,
					songLibraryError: errorMessage,
				});
				console.error("[fetchSongLibrary] Error:", error);
			}
		},

		subscribeToSongLibrary: () => subscribeToSongLibraryFn(get),

		// Internal state management methods
		setSongLibraryEntries: (entries: ReadonlyDeep<Record<string, SongLibraryEntry>>) => {
			set({ songLibraryEntries: entries });
		},

		addSongLibraryEntry: (entry: SongLibraryEntry) => {
			set((state) => ({
				songLibraryEntries: {
					...state.songLibraryEntries,
					[entry.song_id]: entry,
				},
			}));
		},

		removeSongLibraryEntry: (songId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.songLibraryEntries).filter(([id]) => id !== songId),
				);
				return { songLibraryEntries: newEntries };
			});
		},

		setSongLibraryLoading: (loading: boolean) => {
			set({ isSongLibraryLoading: loading });
		},

		setSongLibraryError: (error: string | undefined) => {
			set({ songLibraryError: error });
		},
	};
}
