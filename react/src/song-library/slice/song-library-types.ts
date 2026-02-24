import type { RealtimeEventType } from "@/react/lib/supabase/subscription/subscription-types";
import type { SongLibrary, SongLibraryInsert } from "@/shared/generated/supabaseSchemas";
// Types for Song Library functionality (merged from song-library-schema.ts) to avoid circular imports
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

// Re-export the generated types
export type { SongLibrary, SongLibraryInsert };

/** Extended types for UI state management with owner username and song details */
export type SongLibraryEntry = SongLibrary & {
	/** Username of the song owner */
	owner_username?: string;
	/** Song details from joined song_public table */
	song_public?: {
		song_name: string;
		song_slug: string;
	};
	/** Flattened song details for easier access */
	song_name?: string;
	song_slug?: string;
};

/** For adding songs to library (client-side) */
export type AddSongToSongLibraryRequest = {
	song_id: string;
	song_owner_id: string;
};

/** For removing songs from library (client-side) */
export type RemoveSongFromSongLibraryRequest = {
	song_id: string;
};

/** Supabase realtime payload type for song_library */
export type SongLibraryRealtimePayload = {
	eventType: RealtimeEventType;
	new?: SongLibrary;
	old?: SongLibrary;
};

export type SongLibraryState = {
	/** Current song library entries, indexed by song ID */
	songLibraryEntries: ReadonlyDeep<Record<string, SongLibraryEntry>>;
	/** Whether the library is currently loading */
	isSongLibraryLoading: boolean;
	/** Any error message related to the library */
	songLibraryError?: string | undefined;
};

// Base slice interface for the song library state
export type SongLibrarySliceBase = SongLibraryState & {
	// State management methods
	setSongLibraryError: (error: string | undefined) => void;
	isInSongLibrary: (songId: string) => boolean;
	addSongLibraryEntry: (entry: SongLibraryEntry) => void;
	removeSongLibraryEntry: (songId: string) => void;
};
