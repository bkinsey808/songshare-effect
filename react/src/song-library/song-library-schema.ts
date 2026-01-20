import { type SongLibrary, type SongLibraryInsert } from "@/shared/generated/supabaseSchemas";

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
	eventType: "INSERT" | "UPDATE" | "DELETE";
	new?: SongLibrary;
	old?: SongLibrary;
};
