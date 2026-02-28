import type { PostgrestResponse } from "@supabase/postgrest-js";

import { Effect } from "effect";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import type { CommunityEntry, CommunityEvent, CommunityUser } from "../community-types";
import type { CommunitySlice } from "../slice/CommunitySlice.type";

/**
 * Retrieves a community's public information, member list, and associated
 * events by its slug identifier.
 *
 * The function updates the provided slice's loading and error state, and
 * populates `currentCommunity`, `members`, and `communityEvents` on success.
 * The optional `silent` flag suppresses the loading indicator for background
 * refreshes.
 *
 * @param slug - human-friendly identifier used in URLs
 * @param get - callback supplying the community slice helpers
 * @param options - optional flags (currently only `silent`)
 * @returns effect resolving with the fetched `CommunityEntry` or failing with
 *   an error message
 */
export default function fetchCommunityBySlug(
	slug: string,
	get: () => CommunitySlice,
	options?: { silent?: boolean },
): Effect.Effect<CommunityEntry, Error> {
	return Effect.gen(function* fetchCommunityBySlugGen($) {
		// helpers pulled from the slice; used throughout the generator to
		// update state based on the outcome of each async step.
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
			const publicRes: PostgrestResponse<CommunityEntry> = yield* $(
				Effect.tryPromise<PostgrestResponse<CommunityEntry>, Error>({
					try: () =>
						callSelect<CommunityEntry>(client, "community_public", {
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
			const publicData: CommunityEntry[] = publicRes.data ?? [];
			if (publicData.length === EMPTY_ARRAY_LENGTH) {
				throw new Error("Community not found");
			}
			const [communityPublic] = publicData;
			if (communityPublic === undefined) {
				throw new Error("Community not found");
			}

			// 2. Fetch members
			const membersRes: PostgrestResponse<CommunityUser> = yield* $(
				Effect.tryPromise<PostgrestResponse<CommunityUser>, Error>({
					try: () =>
						callSelect<CommunityUser>(client, "community_user", {
							cols: "*",
							eq: { col: "community_id", val: communityPublic.community_id },
						}),
					catch: (err) =>
						new Error(`Failed to fetch members: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			const rawMembersData: CommunityUser[] = membersRes.data ?? [];
			const userIds = rawMembersData.map((member: CommunityUser) => member.user_id);
			const usersRes: PostgrestResponse<{ user_id: string; username: string }> = yield* $(
				Effect.tryPromise<PostgrestResponse<{ user_id: string; username: string }>, Error>({
					try: () =>
						callSelect<{ user_id: string; username: string }>(client, "user_public", {
							cols: "user_id, username",
							in: { col: "user_id", vals: userIds },
						}),
					catch: (err) =>
						new Error(`Failed to fetch member names: ${extractErrorMessage(err, "Unknown error")}`),
				}),
			);

			const rawUsersData: { user_id: string; username: string }[] = usersRes.data ?? [];
			const userDataMap = new Map(
				rawUsersData.map((user: { user_id: string; username: string }) => [
					user.user_id,
					user.username,
				]),
			);

			// combine membership data with the fetched usernames; if the member is
			// also the community owner we override their role for clarity on the UI
			const members = rawMembersData.map((member) => {
				const isOwnerMember = member.user_id === communityPublic.owner_id;
				return Object.assign(member, {
					username: userDataMap.get(member.user_id),
					role: isOwnerMember ? "owner" : member.role,
				});
			}) as CommunityUser[];

			// 3. Fetch community events
			const eventsRes: PostgrestResponse<CommunityEvent> = yield* $(
				Effect.tryPromise<PostgrestResponse<CommunityEvent>, Error>({
					try: () =>
						callSelect<CommunityEvent>(client, "community_event", {
							cols: "*",
							eq: { col: "community_id", val: communityPublic.community_id },
						}),
					catch: (err) =>
						new Error(
							`Failed to fetch community events: ${extractErrorMessage(err, "Unknown error")}`,
						),
				}),
			);

			const rawEventsData: CommunityEvent[] = eventsRes.data ?? [];
			// without performing an expensive join in the original query.
			const eventIds = rawEventsData.map((event) => event.event_id);
			let communityEvents: CommunityEvent[] = [];

			if (eventIds.length > EMPTY_ARRAY_LENGTH) {
				const eventDetailsRes = yield* $(
					Effect.tryPromise<
						PostgrestResponse<{ event_id: string; event_name: string; event_slug: string }>,
						Error
					>({
						try: () =>
							callSelect<{ event_id: string; event_name: string; event_slug: string }>(
								client,
								"event_public",
								{
									cols: "event_id, event_name, event_slug",
									in: { col: "event_id", vals: eventIds },
								},
							),
						catch: (err) =>
							new Error(
								`Failed to fetch event details: ${extractErrorMessage(err, "Unknown error")}`,
							),
					}),
				);

				const rawEventDetailsData: { event_id: string; event_name: string; event_slug: string }[] =
					eventDetailsRes.data ?? [];
				const eventDetailMap = new Map(
					rawEventDetailsData.map(
						(details: { event_id: string; event_name: string; event_slug: string }) => [
							details.event_id,
							details,
						],
					),
				);

				communityEvents = rawEventsData.map((communityEvent: CommunityEvent) => {
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
