import type { TagLibraryEntry } from "./TagLibraryEntry.type";

export type TagLibraryState = {
	tagLibraryEntries: Record<string, TagLibraryEntry>;
	isTagLibraryLoading: boolean;
	tagLibraryError?: string | undefined;
};
