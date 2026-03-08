import type { Effect } from "effect";

import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type {
	AddPlaylistToLibraryRequest,
	PlaylistLibraryEntry,
	PlaylistLibrarySliceBase,
	RemovePlaylistFromLibraryRequest,
} from "./playlist-library-types";

export type PlaylistLibrarySlice = PlaylistLibrarySliceBase & {
	/** Add a playlist to the user's library (via API - also adds all songs to song library) */
	addPlaylistToLibrary: (
		request: Readonly<AddPlaylistToLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Remove a playlist from the user's library (via API) */
	removePlaylistFromLibrary: (
		request: Readonly<RemovePlaylistFromLibraryRequest>,
	) => Effect.Effect<void, Error>;
	/** Get all playlist IDs in the user's library */
	getPlaylistLibraryIds: () => string[];
	/** Fetch the user's complete playlist library from the server */
	fetchPlaylistLibrary: () => Effect.Effect<void, Error>;

	/** Subscribe to realtime updates for the user's library. Returns an Effect yielding a cleanup function. */
	subscribeToPlaylistLibrary: () => Effect.Effect<() => void, Error>;
	/** Internal: holds the current unsubscribe function for the realtime subscription */
	playlistLibraryUnsubscribe?: () => void;
	/** Internal: holds the current unsubscribe function for playlist_public subscriptions */
	playlistLibraryPublicUnsubscribe?: () => void;

	/** Subscribe to realtime updates for the provided playlist IDs in playlist_public */
	subscribeToPlaylistPublic: (playlistIds: readonly string[]) => Effect.Effect<() => void, Error>;

	/** Internal actions for updating state from subscriptions */
	setPlaylistLibraryEntries: (entries: ReadonlyDeep<Record<string, PlaylistLibraryEntry>>) => void;
	setPlaylistLibraryLoading: (loading: boolean) => void;
};
