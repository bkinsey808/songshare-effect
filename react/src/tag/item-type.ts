export const ITEM_TYPES = ["song", "playlist", "event", "community", "image"] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

/**
 * Per-item-type configuration: junction table, item ID column, and library table.
 */
export const ITEM_TYPE_CONFIG = {
	song: {
		tagTable: "song_tag",
		idCol: "song_id",
		libraryTable: "song_library",
	},
	playlist: {
		tagTable: "playlist_tag",
		idCol: "playlist_id",
		libraryTable: "playlist_library",
	},
	event: {
		tagTable: "event_tag",
		idCol: "event_id",
		libraryTable: "event_library",
	},
	community: {
		tagTable: "community_tag",
		idCol: "community_id",
		libraryTable: "community_library",
	},
	image: {
		tagTable: "image_tag",
		idCol: "image_id",
		libraryTable: "image_library",
	},
} as const satisfies Record<ItemType, { tagTable: string; idCol: string; libraryTable: string }>;
