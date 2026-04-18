import { Effect } from "effect";

import type getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import { ITEM_TYPE_CONFIG, type ItemType } from "@/react/tag/item-type";
import { ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

type TagSlugRow = { tag_slug: string };

/**
 * Fetches all item IDs from the current user's library for the given item type.
 * RLS ensures only the authenticated user's rows are returned.
 *
 * @param client - Supabase client configured with the current user's token
 * @param itemType - which item type's library table to query
 * @returns An Effect that resolves to an array of item IDs
 */
export function fetchLibraryItemIds(
	client: NonNullable<ReturnType<typeof getSupabaseClient>>,
	itemType: ItemType,
): Effect.Effect<string[]> {
	const { libraryTable, idCol: itemIdCol } = ITEM_TYPE_CONFIG[itemType];

	return Effect.tryPromise({
		try: () => callSelect(client, libraryTable, { cols: itemIdCol }),
		catch: (error) => new Error(String(error)),
	}).pipe(
		Effect.map((result) => {
			if (!isRecord(result) || result.error) {
				return [] as string[];
			}
			const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
			return rows
				.filter((row): row is Record<string, string> => isRecord(row) && isString(row[itemIdCol]))
				.map((row) => row[itemIdCol])
				.filter((id): id is string => id !== undefined);
		}),
		Effect.orElseSucceed(() => [] as string[]),
	);
}

/**
 * Fetches tag slugs for a specific `itemType`, filtered to only items present
 * in the current user's library.
 *
 * @param client - Supabase client configured with the current user's token
 * @param itemType - which item type's junction table to query (song, playlist, etc.)
 * @param slugs - array of tag slugs to filter the junction table by
 * @param libraryItemIds - item IDs from the user's library; empty means return []
 * @returns An Effect that resolves to an array of matching tag slugs (may be empty)
 */
export function fetchSlugsByItemType(
	client: NonNullable<ReturnType<typeof getSupabaseClient>>,
	itemType: ItemType,
	opts: { slugs: string[]; libraryItemIds: string[] },
): Effect.Effect<string[]> {
	const { slugs, libraryItemIds } = opts;

	if (libraryItemIds.length === ZERO) {
		return Effect.succeed([]);
	}

	const { tagTable, idCol: itemIdCol } = ITEM_TYPE_CONFIG[itemType];
	const librarySet = new Set(libraryItemIds);

	return Effect.tryPromise({
		try: () =>
			callSelect<TagSlugRow>(client, tagTable, {
				cols: `tag_slug, ${itemIdCol}`,
				in: { col: "tag_slug", vals: slugs },
			}),
		catch: (error) => new Error(String(error)),
	}).pipe(
		Effect.map((result) => {
			if (!isRecord(result) || result.error) {
				return [] as string[];
			}
			const rows: unknown[] = Array.isArray(result.data) ? result.data : [];
			return rows
				.filter(
					(row): row is TagSlugRow =>
						isRecord(row) &&
						isString(row["tag_slug"]) &&
						isString(row[itemIdCol]) &&
						librarySet.has(row[itemIdCol]),
				)
				.map((row) => row.tag_slug);
		}),
		Effect.orElseSucceed(() => [] as string[]),
	);
}
