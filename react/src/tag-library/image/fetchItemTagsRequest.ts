import { Effect } from "effect";

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
 * @returns An Effect that resolves to an array of tag slugs (never fails)
 */
export default function fetchItemTagsEffect(
	itemType: ItemType,
	itemId: string,
): Effect.Effect<string[]> {
	return Effect.gen(function* fetchItemTagsGen($) {
		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (error) => new Error(String(error)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (client === undefined) {
			return [];
		}

		const tableName = ITEM_TYPE_TABLE_MAP[itemType];
		const idColumn = ITEM_TYPE_ID_COLUMN_MAP[itemType];

		const result = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<TagRow>(client, tableName, {
						cols: "tag_slug",
						eq: { col: idColumn, val: itemId },
					}),
				catch: (error) => new Error(String(error)),
			}),
		);

		if (!isRecord(result) || result.error) {
			return [];
		}

		const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
		return rows
			.filter((row): row is TagRow => isRecord(row) && isString(row["tag_slug"]))
			.map((row) => row.tag_slug);
	}).pipe(Effect.orElseSucceed(() => []));
}
