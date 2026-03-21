import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";
import { ZERO } from "@/shared/constants/shared-constants";

import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import { ITEM_TYPES, type ItemType, type TagItemCounts } from "./TagItemCounts.type";

/**
 * Maps an `ItemType` to its Supabase junction table name.
 * Used to query which tags are attached to a given item type.
 */
const ITEM_TYPE_TABLE_MAP: Record<ItemType, string> = {
	song: "song_tag",
	playlist: "playlist_tag",
	event: "event_tag",
	community: "community_tag",
	image: "image_tag",
};

type TagSlugRow = { tag_slug: string };

/**
 * Fetches tag slugs that exist for a specific `itemType` from its junction table.
 *
 * @param client - Supabase client configured with the current user's token
 * @param itemType - which item type's junction table to query (song, playlist, etc.)
 * @param slugs - array of tag slugs to filter the junction table by
 * @returns An Effect that resolves to an array of matching tag slugs (may be empty)
 */
function fetchSlugsByItemType(
	client: NonNullable<ReturnType<typeof getSupabaseClient>>,
	itemType: ItemType,
	slugs: string[],
): Effect.Effect<string[]> {
	return Effect.tryPromise({
		try: () =>
			callSelect<TagSlugRow>(client, ITEM_TYPE_TABLE_MAP[itemType], {
				cols: "tag_slug",
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
				.filter((row): row is TagSlugRow => isRecord(row) && isString(row["tag_slug"]))
				.map((row) => row.tag_slug);
		}),
		Effect.orElseSucceed(() => [] as string[]),
	);
}

/**
 * Fetches per-item-type counts for each tag in the user's tag library.
 * Runs one parallel query per item type against its junction table, then
 * aggregates the results into a counts record stored on the slice.
 *
 * @param get - Getter for the `TagLibrarySlice`.
 * @returns An Effect that resolves when counts are stored, or fails with an Error.
 */
export default function fetchTagLibraryCountsEffect(
	get: () => TagLibrarySlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* fetchTagLibraryCountsGen($) {
		const { getTagLibrarySlugs, setTagLibraryCounts } = get();
		const slugs = getTagLibrarySlugs();

		if (slugs.length === ZERO) {
			yield* $(
				Effect.sync(() => {
					setTagLibraryCounts({});
				}),
			);
			return;
		}

		const userToken = yield* $(
			Effect.tryPromise({
				try: () => getSupabaseAuthToken(),
				catch: (error) => new Error(String(error)),
			}),
		);

		const client = getSupabaseClient(userToken);
		if (!client) {
			return yield* $(Effect.fail(new Error("No Supabase client available")));
		}

		const effectsRecord: Record<ItemType, Effect.Effect<string[]>> = {
			song: fetchSlugsByItemType(client, "song", slugs),
			playlist: fetchSlugsByItemType(client, "playlist", slugs),
			event: fetchSlugsByItemType(client, "event", slugs),
			community: fetchSlugsByItemType(client, "community", slugs),
			image: fetchSlugsByItemType(client, "image", slugs),
		};

		const tagSlugsByItemType = yield* $(
			Effect.all(effectsRecord, { concurrency: "unbounded" }),
		);

		const counts: Record<string, TagItemCounts> = {};
		for (const slug of slugs) {
			counts[slug] = { song: ZERO, playlist: ZERO, event: ZERO, community: ZERO, image: ZERO };
		}

		for (const itemType of ITEM_TYPES) {
			for (const slug of tagSlugsByItemType[itemType]) {
				const entry = counts[slug];
				if (entry !== undefined) {
					entry[itemType]++;
				}
			}
		}

		yield* $(
			Effect.sync(() => {
				setTagLibraryCounts(counts);
			}),
		);
	});
}
