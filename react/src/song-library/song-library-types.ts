// Types for Song Library functionality to avoid circular imports
import { type SongLibraryEntry } from "./song-library-schema";

// Base slice interface for the song library state
export type SongLibrarySliceBase = {
	libraryEntries: Record<string, SongLibraryEntry>;
	isLibraryLoading: boolean;
	libraryError: string | undefined;

	// State management methods
	setLibraryError: (error: string | undefined) => void;
	isInLibrary: (songId: string) => boolean;
	addLibraryEntry: (entry: SongLibraryEntry) => void;
	removeLibraryEntry: (songId: string) => void;
};
