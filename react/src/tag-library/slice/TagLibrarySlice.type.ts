import type { Effect } from "effect";

import type { TagItemCounts } from "../fetch/TagItemCounts.type";
import type { TagLibraryEntry } from "./TagLibraryEntry.type";
import type { TagLibraryState } from "./TagLibraryState.type";

export type TagLibrarySlice = TagLibraryState & {
	fetchTagLibrary: () => Effect.Effect<void, Error>;
	fetchTagLibraryCounts: () => Effect.Effect<void, Error>;
	removeTagFromLibrary: (tagSlug: string) => Effect.Effect<void, Error>;
	subscribeToTagLibrary: () => Effect.Effect<() => void, Error>;
	subscribeToTagCounts: () => Effect.Effect<() => void, Error>;
	removeTagCounts: (tagSlug: string) => void;
	tagLibraryUnsubscribe?: () => void;
	setTagLibraryEntries: (entries: Record<string, TagLibraryEntry>) => void;
	setTagLibraryCounts: (counts: Record<string, TagItemCounts>) => void;
	addTagLibraryEntry: (entry: TagLibraryEntry) => void;
	removeTagLibraryEntry: (tagSlug: string) => void;
	setTagLibraryLoading: (loading: boolean) => void;
	setTagLibraryError: (error: string | undefined) => void;
	isInTagLibrary: (tagSlug: string) => boolean;
	getTagLibrarySlugs: () => string[];
};
