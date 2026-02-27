import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { CommunityEntry, CommunityUser, CommunityEvent } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Fetch community details, members, and events by slug.
 */
export default function fetchCommunityBySlug(
	slug: string,
	get: () => CommunitySlice,
	options?: { silent?: boolean },
): Effect.Effect<CommunityEntry, Error> {
	return Effect.gen(function* fetchCommunityBySlugGen($) {
		const {
			setCurrentCommunity,
			setMembers,
			setCommunityEvents,
			setCommunityLoading,
			setCommunityError,
		} = get();

		if (options?.silent !== true) {
			setCommunityLoading(true);
		}
		setCommunityError(undefined);

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

			// 1. Fetch community public data
			const publicRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "community_public", {
							cols: "*",
							eq: { col: "slug", val: slug },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community public data: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const EMPTY_ARRAY_LENGTH = 0;
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const publicData = publicRes.data as CommunityEntry[];
			if (publicData.length === EMPTY_ARRAY_LENGTH) {
				throw new Error("Community not found");
			}
			const [communityPublic] = publicData;
			if (communityPublic === undefined) {
				throw new Error("Community not found");
			}

			// 2. Fetch members
			const membersRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "community_user", {
							cols: "*",
							eq: { col: "community_id", val: communityPublic.community_id },
						}),
					catch: (err) =>
						new Error(`Failed to fetch members: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const rawMembersData = (membersRes.data ?? []) as CommunityUser[];

			// Fetch usernames separately to avoid join issues
			const userIds = rawMembersData.map((member) => member.user_id);
			const usersRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "user_public", {
							cols: "user_id, username",
							in: { col: "user_id", vals: userIds },
						}),
					catch: (err) =>
						new Error(`Failed to fetch member names: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const rawUsersData = (usersRes.data ?? []) as { user_id: string; username: string }[];
			const userDataMap = new Map(rawUsersData.map((user) => [user.user_id, user.username]));

			const members = rawMembersData.map((member) => {
				const isOwnerMember = member.user_id === communityPublic.owner_id;
				return Object.assign(member, {
					username: userDataMap.get(member.user_id),
					role: isOwnerMember ? "owner" : member.role,
				});
			}) as CommunityUser[];

			// 3. Fetch community events
			const eventsRes = yield* $(
				Effect.tryPromise({
					try: () =>
						callSelect(client, "community_event", {
							cols: "*",
							eq: { col: "community_id", val: communityPublic.community_id },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community events: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const rawEventsData = (eventsRes.data ?? []) as CommunityEvent[];

			// Fetch event details separately
			const eventIds = rawEventsData.map((event) => event.event_id);
			let communityEvents: CommunityEvent[] = [];

			if (eventIds.length > EMPTY_ARRAY_LENGTH) {
				const eventDetailsRes = yield* $(
					Effect.tryPromise({
						try: () =>
							callSelect(client, "event_public", {
								cols: "event_id, event_name, event_slug",
								in: { col: "event_id", vals: eventIds },
							}),
						catch: (err) =>
							new Error(
								`Failed to fetch event details: ${extractErrorMessage(err, "Unknown error")}`,
							),
					}),
				);

				// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
				const rawEventDetailsData = (eventDetailsRes.data ?? []) as {
					event_id: string;
					event_name: string;
					event_slug: string;
				}[];
				const eventDetailMap = new Map(
					rawEventDetailsData.map((details) => [details.event_id, details]),
				);

				communityEvents = rawEventsData.map((communityEvent) => {
					const details = eventDetailMap.get(communityEvent.event_id);
					return Object.assign(communityEvent, {
						event_name: details?.event_name,
						event_slug: details?.event_slug,
					});
				});
			}

			const communityEntry: CommunityEntry = {
				community_id: communityPublic.community_id,
				owner_id: communityPublic.owner_id,
				name: communityPublic.name,
				slug: communityPublic.slug,
				description: communityPublic.description,
				is_public: communityPublic.is_public,
				public_notes: communityPublic.public_notes,
				created_at: communityPublic.created_at || new Date().toISOString(),
				updated_at: communityPublic.updated_at || new Date().toISOString(),
			};

			setCurrentCommunity(communityEntry);
			setMembers(members);
			setCommunityEvents(communityEvents);

			setCommunityLoading(false);
			return communityEntry;
		} catch (error: unknown) {
			setCommunityLoading(false);
			const message = error instanceof Error ? error.message : String(error);
			setCommunityError(message);
			return yield* $(Effect.fail(new Error(message)));
		}
	});
}
