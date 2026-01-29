import type { RealtimeEventType } from "@/react/supabase/subscription/subscription-types";
import type { PlaylistLibrary, PlaylistLibraryInsert } from "@/shared/generated/supabaseSchemas";
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

// Re-export the generated types
export type { PlaylistLibrary, PlaylistLibraryInsert };

/** Extended types for UI state management with owner username and playlist details */
export type PlaylistLibraryEntry = PlaylistLibrary & {
	/** Username of the playlist owner */
	owner_username?: string;
	/** Playlist details from joined playlist_public table */
	playlist_public?: {
		playlist_name: string;
		playlist_slug: string;
	};
	/** Flattened playlist details for easier access */
	playlist_name?: string;
	playlist_slug?: string;
};

/** For adding playlists to library (client-side) */
export type AddPlaylistToLibraryRequest = {
	playlist_id: string;
	playlist_owner_id: string;
};

/** For removing playlists from library (client-side) */
export type RemovePlaylistFromLibraryRequest = {
	playlist_id: string;
};

/** Supabase realtime payload type for playlist_library */
export type PlaylistLibraryRealtimePayload = {
	eventType: RealtimeEventType;
	new?: PlaylistLibrary;
	old?: PlaylistLibrary;
};

/** State for the playlist library slice */
export type PlaylistLibraryState = {
	/** Current playlist library entries, indexed by playlist ID */
	playlistLibraryEntries: ReadonlyDeep<Record<string, PlaylistLibraryEntry>>;
	/** Whether the library is currently loading */
	isPlaylistLibraryLoading: boolean;
	/** Any error message related to the library */
	playlistLibraryError?: string | undefined;
};

/** Base slice interface for the playlist library state */
export type PlaylistLibrarySliceBase = PlaylistLibraryState & {
	/** Set playlist library error */
	setPlaylistLibraryError: (error: string | undefined) => void;
	/** Check if a playlist is in the user's library */
	isInPlaylistLibrary: (playlistId: string) => boolean;
	/** Add a playlist library entry to the state */
	addPlaylistLibraryEntry: (entry: PlaylistLibraryEntry) => void;
	/** Remove a playlist library entry from the state */
	removePlaylistLibraryEntry: (playlistId: string) => void;
};
