/**
 * Tag library types
 *
 * Type definitions used by the Tag Library slice and helpers. These types
 * mirror the database schema for `tag_library`.
 */

export type TagLibraryEntry = {
	user_id: string;
	tag_slug: string;
};

export type TagLibraryState = {
	tagLibraryEntries: Record<string, TagLibraryEntry>;
	isTagLibraryLoading: boolean;
	tagLibraryError?: string | undefined;
};
