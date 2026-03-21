import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import { ZERO } from "@/shared/constants/shared-constants";

import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import { ITEM_TYPES, type ItemType } from "@/react/tag/item-type";

import type { TagItemCounts } from "./TagItemCounts.type";
import { fetchLibraryItemIds, fetchSlugsByItemType } from "./fetchSlugsByItemType";

/**
 * Fetches per-item-type counts for each tag in the user's tag library,
 * restricted to items that are also in the user's corresponding library.
 * Runs library-id and count queries in parallel, then aggregates results.
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

		// Fetch each library's item IDs in parallel (RLS-filtered to current user).
		// Community has no library so it always yields [].
		const libraryIdsRecord = yield* $(
			Effect.all(
				{
					song: fetchLibraryItemIds(client, "song"),
					playlist: fetchLibraryItemIds(client, "playlist"),
					event: fetchLibraryItemIds(client, "event"),
					community: Effect.succeed([] as string[]),
					image: fetchLibraryItemIds(client, "image"),
				},
				{ concurrency: "unbounded" },
			),
		);

		// Fetch tag slugs for each item type, filtered by the user's library IDs.
		const effectsRecord: Record<ItemType, Effect.Effect<string[]>> = {
			song: fetchSlugsByItemType(client, "song", {
				slugs,
				libraryItemIds: libraryIdsRecord.song,
			}),
			playlist: fetchSlugsByItemType(client, "playlist", {
				slugs,
				libraryItemIds: libraryIdsRecord.playlist,
			}),
			event: fetchSlugsByItemType(client, "event", {
				slugs,
				libraryItemIds: libraryIdsRecord.event,
			}),
			community: Effect.succeed([]),
			image: fetchSlugsByItemType(client, "image", {
				slugs,
				libraryItemIds: libraryIdsRecord.image,
			}),
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
