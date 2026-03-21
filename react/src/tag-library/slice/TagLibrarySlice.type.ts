import type { Effect } from "effect";

import type { TagLibraryEntry } from "./TagLibraryEntry.type";
import type { TagLibraryState } from "./TagLibraryState.type";

export type TagLibrarySlice = TagLibraryState & {
	fetchTagLibrary: () => Effect.Effect<void, Error>;
	subscribeToTagLibrary: () => Effect.Effect<() => void, Error>;
	tagLibraryUnsubscribe?: () => void;
	setTagLibraryEntries: (entries: Record<string, TagLibraryEntry>) => void;
	addTagLibraryEntry: (entry: TagLibraryEntry) => void;
	removeTagLibraryEntry: (tagSlug: string) => void;
	setTagLibraryLoading: (loading: boolean) => void;
	setTagLibraryError: (error: string | undefined) => void;
	isInTagLibrary: (tagSlug: string) => boolean;
	getTagLibrarySlugs: () => string[];
};
