// Song Library Zustand slice with subscription functionality
import type { StateCreator } from "zustand";

import { addSongToLibrary } from "./addSongToLibrary";
import { removeSongFromLibrary } from "./removeSongFromLibrary";
import {
	type AddToLibraryRequest,
	type RemoveFromLibraryRequest,
	type SongLibraryEntry,
} from "./song-library-schema";
import { type SongLibrarySliceBase } from "./song-library-types";
import { subscribeToLibrary as subscribeToLibraryFn } from "./subscribeToLibrary";
import { sliceResetFns } from "@/react/zustand/useAppStore";

export type SongLibrarySlice = SongLibrarySliceBase & {
	/** Add a song to the user's library */
	addToLibrary: (request: Readonly<AddToLibraryRequest>) => Promise<void>;
	/** Remove a song from the user's library */
	removeFromLibrary: (
		request: Readonly<RemoveFromLibraryRequest>,
	) => Promise<void>;
	/** Get all song IDs in the user's library */
	getLibrarySongIds: () => string[];
	/** Fetch the user's complete library from the server */
	fetchLibrary: () => Promise<void>;

	/** Subscribe to realtime updates for the user's library. Returns an unsubscribe function. */
	subscribeToLibrary: () => (() => void) | undefined;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	libraryUnsubscribe?: () => void;

	/** Internal actions for updating state from subscriptions */
	setLibraryEntries: (entries: Record<string, SongLibraryEntry>) => void;
	setLibraryLoading: (loading: boolean) => void;
};

const initialState = {
	libraryEntries: {} as Record<string, SongLibraryEntry>,
	isLibraryLoading: false,
	libraryError: undefined as string | undefined,
};

export const createSongLibrarySlice: StateCreator<
	SongLibrarySlice,
	[["zustand/devtools", never]],
	[],
	SongLibrarySlice
> = (set, get) => {
	sliceResetFns.add(() => {
		// Unsubscribe before resetting state
		const { libraryUnsubscribe } = get();
		if (libraryUnsubscribe) {
			libraryUnsubscribe();
		}
		set(initialState);
	});

	return {
		...initialState,

		// Public API methods
		addToLibrary: async (request: Readonly<AddToLibraryRequest>) => {
			try {
				await addSongToLibrary(request, get);
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to add song to library";
				const { setLibraryError } = get();
				setLibraryError(errorMessage);
				console.error("[addToLibrary] Error:", error);
				throw error;
			}
		},
		removeFromLibrary: async (request: Readonly<RemoveFromLibraryRequest>) => {
			try {
				await removeSongFromLibrary(request, get);
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to remove song from library";
				const { setLibraryError } = get();
				setLibraryError(errorMessage);
				console.error("[removeFromLibrary] Error:", error);
				throw error;
			}
		},

		isInLibrary: (songId: string) => {
			const { libraryEntries } = get();
			return songId in libraryEntries;
		},

		getLibrarySongIds: () => {
			const { libraryEntries } = get();
			return Object.keys(libraryEntries);
		},

		fetchLibrary: async () => {
			try {
				set({ isLibraryLoading: true, libraryError: undefined });

				// Import here to avoid circular dependencies
				const { getSupabaseAuthToken } = await import(
					"@/react/supabase/getSupabaseAuthToken"
				);
				const { getSupabaseClient } = await import(
					"@/react/supabase/supabaseClient"
				);
				const userToken = await getSupabaseAuthToken();
				const client = getSupabaseClient(userToken);

				if (!client) {
					throw new Error("No Supabase client available");
				}

				const { data, error } = await client.from("song_library").select("*");

				if (error) {
					throw error;
				}

				// Fetch song details for all entries
				const songIds = [
					...new Set((data ?? []).map((entry) => entry.song_id)),
				];
				const { data: songData } = await client
					.from("song_public")
					.select("song_id, song_name, song_slug")
					.in("song_id", songIds);

				// Create a map of song_id to song details
				const songMap = new Map(
					(songData ?? []).map((song) => [
						song.song_id,
						{ song_name: song.song_name, song_slug: song.song_slug },
					]),
				);

				// Fetch owner usernames for all entries
				const ownerIds = [
					...new Set((data ?? []).map((entry) => entry.song_owner_id)),
				];
				const { data: ownerData } = await client
					.from("user_public")
					.select("user_id, username")
					.in("user_id", ownerIds);

				// Create a map of owner_id to username
				const ownerMap = new Map(
					(ownerData ?? []).map((owner) => [owner.user_id, owner.username]),
				);

				// Convert array to object indexed by song_id and include owner username and song details
				const entriesRecord = (data ?? []).reduce<
					Record<string, SongLibraryEntry>
				>((acc, entry) => {
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
					return { ...acc, [entry.song_id]: libraryEntry };
				}, {});

				set({
					libraryEntries: entriesRecord,
					isLibraryLoading: false,
					libraryError: undefined,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to fetch library";
				set({
					isLibraryLoading: false,
					libraryError: errorMessage,
				});
				console.error("[fetchLibrary] Error:", error);
			}
		},

		subscribeToLibrary: () => subscribeToLibraryFn(get),

		// Internal state management methods
		setLibraryEntries: (entries: Record<string, SongLibraryEntry>) => {
			set({ libraryEntries: entries });
		},

		// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
		addLibraryEntry: (entry: SongLibraryEntry) => {
			set((state) => ({
				libraryEntries: {
					...state.libraryEntries,
					[entry.song_id]: entry,
				},
			}));
		},

		removeLibraryEntry: (songId: string) => {
			set((state) => {
				const newEntries = Object.fromEntries(
					Object.entries(state.libraryEntries).filter(([id]) => id !== songId),
				);
				return { libraryEntries: newEntries };
			});
		},

		setLibraryLoading: (loading: boolean) => {
			set({ isLibraryLoading: loading });
		},

		setLibraryError: (error: string | undefined) => {
			set({ libraryError: error });
		},
	};
};
