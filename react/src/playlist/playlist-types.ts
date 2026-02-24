import type { RealtimeEventType } from "@/react/lib/supabase/subscription/subscription-types";
import type {
	Playlist,
	PlaylistInsert,
	PlaylistPublic,
	PlaylistPublicInsert,
} from "@/shared/generated/supabaseSchemas";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

// Re-export the generated types
export type { Playlist, PlaylistInsert, PlaylistPublic, PlaylistPublicInsert };

/** Extended type for UI with combined data */
export type PlaylistEntry = Playlist & {
	/** Public playlist data */
	public?: PlaylistPublic;
	/** Username of the playlist owner */
	owner_username?: string;
};

/** Request to save a playlist (create or update) - all song changes go through this */
export type SavePlaylistRequest = {
	playlist_id?: string;
	playlist_name: string;
	playlist_slug: string;
	public_notes?: string;
	private_notes?: string;
	song_order?: string[];
};

/** Supabase realtime payload type for playlist */
export type PlaylistRealtimePayload = {
	eventType: RealtimeEventType;
	new?: Playlist;
	old?: Playlist;
};

/** Supabase realtime payload type for playlist_public */
export type PlaylistPublicRealtimePayload = {
	eventType: RealtimeEventType;
	new?: PlaylistPublic;
	old?: PlaylistPublic;
};

/** State for the playlist slice */
export type PlaylistState = {
	/** Current playlist being viewed/edited */
	currentPlaylist: ReadonlyDeep<PlaylistEntry> | undefined;
	/** Whether the playlist is currently loading */
	isPlaylistLoading: boolean;
	/** Any error message related to the playlist */
	playlistError?: string | undefined;
	/** Whether the playlist is being saved */
	isPlaylistSaving: boolean;
};

/** Base slice interface for the playlist state */
export type PlaylistSliceBase = PlaylistState & {
	/** Set the current playlist */
	setCurrentPlaylist: (playlist: PlaylistEntry | undefined) => void;
	/** Set playlist loading state */
	setPlaylistLoading: (loading: boolean) => void;
	/** Set playlist error */
	setPlaylistError: (error: string | undefined) => void;
	/** Set playlist saving state */
	setPlaylistSaving: (saving: boolean) => void;
	/** Check if a song is in the current playlist */
	isSongInPlaylist: (songId: string) => boolean;
};
