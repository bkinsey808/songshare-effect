// Types for Song Library functionality to avoid circular imports
import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import { type SongLibraryEntry } from "./song-library-schema";

export type SongLibraryState = {
	/** Current song library entries, indexed by song ID */
	libraryEntries: ReadonlyDeep<Record<string, SongLibraryEntry>>;
	/** Whether the library is currently loading */
	isLibraryLoading: boolean;
	/** Any error message related to the library */
	libraryError?: string | undefined;
};

// Base slice interface for the song library state
export type SongLibrarySliceBase = SongLibraryState & {
	// State management methods
	setLibraryError: (error: string | undefined) => void;
	isInLibrary: (songId: string) => boolean;
	addLibraryEntry: (entry: SongLibraryEntry) => void;
	removeLibraryEntry: (songId: string) => void;
};
