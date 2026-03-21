import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

const ITEM_TYPE_TABLE_MAP = {
	song: "song_tag",
	playlist: "playlist_tag",
	event: "event_tag",
	community: "community_tag",
	image: "image_tag",
} as const;

const ITEM_TYPE_ID_COLUMN_MAP = {
	song: "song_id",
	playlist: "playlist_id",
	event: "event_id",
	community: "community_id",
	image: "image_id",
} as const;

type ItemType = keyof typeof ITEM_TYPE_TABLE_MAP;

type TagRow = { tag_slug: string };

/**
 * Fetches the current tag slugs for a given item directly from Supabase.
 * Returns an empty array on error or when the item has no tags.
 *
 * @param itemType - The type of item to fetch tags for
 * @param itemId - The UUID of the item
 * @returns Array of tag slugs currently applied to the item
 */
export default async function fetchItemTagsRequest(
	itemType: ItemType,
	itemId: string,
): Promise<string[]> {
	try {
		const userToken = await getSupabaseAuthToken();
		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return [];
		}

		const tableName = ITEM_TYPE_TABLE_MAP[itemType];
		const idColumn = ITEM_TYPE_ID_COLUMN_MAP[itemType];

		const result = await callSelect<TagRow>(client, tableName, {
			cols: "tag_slug",
			eq: { col: idColumn, val: itemId },
		});

		if (!isRecord(result) || result.error) {
			return [];
		}

		const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
		return rows
			.filter((row): row is TagRow => isRecord(row) && isString(row["tag_slug"]))
			.map((row) => row.tag_slug);
	} catch {
		return [];
	}
}
