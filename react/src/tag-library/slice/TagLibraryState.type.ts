import type { TagItemCounts } from "../fetch/TagItemCounts.type";
import type { TagLibraryEntry } from "./TagLibraryEntry.type";

export type TagLibraryState = {
	tagLibraryEntries: Record<string, TagLibraryEntry>;
	tagLibraryCounts: Record<string, TagItemCounts>;
	isTagLibraryLoading: boolean;
	tagLibraryError?: string | undefined;
};
