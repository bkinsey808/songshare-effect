import type { PostgrestResponse } from "@supabase/postgrest-js";
import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { EventCommunityEntry } from "../event-types";
import type { EventSlice } from "../slice/EventSlice.type";

/**
 * Fetches all communities that the given event belongs to, enriched with
 * community name and slug from `community_public`.
 *
 * @param eventId - the event whose community memberships are being fetched
 * @param get - slice accessor returning event slice helpers
 * @param options - optional flags (silent: suppress loading indicator)
 * @returns effect resolving with the fetched community entries
 */
export default function fetchEventCommunities(
	eventId: string,
	get: () => EventSlice,
	options?: { silent?: boolean },
): Effect.Effect<readonly EventCommunityEntry[], Error> {
	return Effect.gen(function* fetchEventCommunitiesGen($) {
		const { setEventCommunities, setEventLoading, setEventError } = get();

		if (options?.silent !== true) {
			setEventLoading(true);
		}
		setEventError(undefined);

		try {
			const userToken = yield* $(
				Effect.tryPromise({
					try: () => getSupabaseAuthToken(),
					catch: (err) =>
						new Error(`Failed to get auth token: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			const client = getSupabaseClient(userToken);
			if (!client) {
				throw new Error("Supabase client not available");
			}

			// Fetch community_event rows for this event
			const rawRes: PostgrestResponse<{
				community_id: string;
				event_id: string;
				created_at: string;
			}> = yield* $(
				Effect.tryPromise<
					PostgrestResponse<{ community_id: string; event_id: string; created_at: string }>,
					Error
				>({
					try: () =>
						callSelect<{ community_id: string; event_id: string; created_at: string }>(
							client,
							"community_event",
							{
								cols: "community_id, event_id, created_at",
								eq: { col: "event_id", val: eventId },
							},
						),
					catch: (err) =>
						new Error(
							`Failed to fetch event communities: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const rawRows = rawRes.data ?? [];

			const EMPTY = 0;
			if (rawRows.length === EMPTY) {
				setEventCommunities([]);
				return [];
			}

			// Enrich with community name and slug from community_public
			const communityIds = rawRows.map((row) => row.community_id);
			const publicRes: PostgrestResponse<{
				community_id: string;
				community_name: string;
				community_slug: string;
			}> = yield* $(
				Effect.tryPromise<
					PostgrestResponse<{
						community_id: string;
						community_name: string;
						community_slug: string;
					}>,
					Error
				>({
					try: () =>
						callSelect<{ community_id: string; community_name: string; community_slug: string }>(
							client,
							"community_public",
							{
								cols: "community_id, community_name, community_slug",
								in: { col: "community_id", vals: communityIds },
							},
						),
					catch: (err) =>
						new Error(
							`Failed to fetch community details: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const publicDetail = new Map((publicRes.data ?? []).map((row) => [row.community_id, row]));

			const entries: EventCommunityEntry[] = rawRows.map((row) => {
				const detail = publicDetail.get(row.community_id);
				const base: EventCommunityEntry = {
					community_id: row.community_id,
					event_id: row.event_id,
					created_at: row.created_at,
				};
				if (detail?.community_name !== undefined) {
					base.community_name = detail.community_name;
				}
				if (detail?.community_slug !== undefined) {
					base.community_slug = detail.community_slug;
				}
				return base;
			});

			setEventCommunities(entries);
			return entries;
		} finally {
			setEventLoading(false);
		}
	});
}
