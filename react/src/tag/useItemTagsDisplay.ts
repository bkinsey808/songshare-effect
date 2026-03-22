import { Effect } from "effect";
import { useEffect, useState } from "react";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import handleSubscriptionStatus from "@/react/lib/supabase/subscription/status/handleSubscriptionStatus";
import isSubscriptionStatus from "@/react/lib/supabase/subscription/status/isSubscriptionStatus";
import fetchItemTagsEffect from "@/react/tag-library/image/fetchItemTagsRequest";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import { ITEM_TYPE_CONFIG, type ItemType } from "./item-type";

/**
 * Fetches and maintains a real-time list of tag slugs for a displayed item.
 *
 * On mount, fetches the current tags from the junction table. Then subscribes
 * to Supabase Realtime postgres_changes filtered to the specific item so
 * INSERT and DELETE events update the local list immediately — no page reload
 * or manual refetch needed.
 *
 * @param itemType - The type of item (song, playlist, event, community, image).
 * @param itemId - UUID of the item; when `undefined` the hook is a no-op.
 * @returns Current array of tag slugs for the item.
 */
export default function useItemTagsDisplay(
	itemType: ItemType,
	itemId: string | undefined,
): string[] {
	const [tags, setTags] = useState<string[]>([]);

	// Initial fetch — populates the list before the subscription is ready.
	useEffect(() => {
		if (itemId === undefined || itemId.trim() === "") {
			return;
		}
		void (async (): Promise<void> => {
			const fetched = await Effect.runPromise(fetchItemTagsEffect(itemType, itemId));
			setTags(fetched);
		})();
	}, [itemType, itemId]);

	// Realtime subscription — keeps tags in sync with INSERT/DELETE events.
	useEffect(() => {
		if (itemId === undefined || itemId.trim() === "") {
			return;
		}

		const { tagTable, idCol } = ITEM_TYPE_CONFIG[itemType];
		let subCleanup: (() => void) | undefined = undefined;

		void (async (): Promise<void> => {
			let userToken: Awaited<ReturnType<typeof getSupabaseAuthToken>> | undefined = undefined;
			try {
				userToken = await getSupabaseAuthToken();
			} catch {
				return;
			}

			const client = getSupabaseClient(userToken);
			if (client === undefined) {
				return;
			}

			subCleanup = createRealtimeSubscription({
				client,
				tableName: tagTable,
				filter: `${idCol}=eq.${itemId}`,
				onEvent: (payload) =>
					Effect.sync(() => {
						if (!isRecord(payload)) {
							return;
						}
						const { eventType } = payload;
						if (eventType === "INSERT") {
							const record = payload["new"];
							if (isRecord(record)) {
								const rawSlug = record["tag_slug"];
								if (isString(rawSlug)) {
									setTags((prev) => (prev.includes(rawSlug) ? prev : [...prev, rawSlug]));
								}
							}
						} else if (eventType === "DELETE") {
							const record = payload["old"];
							if (isRecord(record)) {
								const rawSlug = record["tag_slug"];
								if (isString(rawSlug)) {
									setTags((prev) => prev.filter((slug) => slug !== rawSlug));
								}
							}
						}
					}),
				onStatus: (status, error) => {
					const subStatus = isSubscriptionStatus(status) ? status : "CHANNEL_ERROR";
					handleSubscriptionStatus(tagTable, subStatus, error);
				},
			});
		})();

		return (): void => {
			subCleanup?.();
		};
	}, [itemType, itemId]);

	return tags;
}
