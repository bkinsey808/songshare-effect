export const ITEM_TYPES = ["song", "playlist", "event", "community", "image"] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export type TagItemCounts = Record<ItemType, number>;
