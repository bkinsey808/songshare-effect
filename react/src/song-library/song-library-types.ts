// Types for Song Library functionality to avoid circular imports
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { type SongLibraryEntry } from "./song-library-schema";

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
