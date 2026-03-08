import { Effect } from "effect";

import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import type { Database } from "@/shared/generated/supabaseTypes";

import type { CommunityUser } from "../community-types";
import cloneCommunityRow from "./cloneCommunityRow";

const EMPTY_COUNT = 0;

/**
 * Loads community membership rows and enriches them with usernames.
 *
 * @param client - authenticated Supabase client
 * @param communityId - community identifier
 * @param ownerId - owner id used to normalize the owner role in UI state
 * @returns effect that yields enriched community members
 */
export default function fetchCommunityMembers(
	client: SupabaseClientLike<Database>,
	communityId: string,
	ownerId: string,
): Effect.Effect<CommunityUser[], Error> {
	return Effect.gen(function* fetchCommunityMembersGen($) {
		const membersRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<CommunityUser>(client, "community_user", {
						cols: "*",
						eq: { col: "community_id", val: communityId },
					}),
				catch: (err) =>
					new Error(`Failed to fetch members: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const rawMembersData: CommunityUser[] = membersRes.data ?? [];
		const userIds = rawMembersData.map((member) => member.user_id);

		if (userIds.length === EMPTY_COUNT) {
			return [];
		}

		const usersRes = yield* $(
			Effect.tryPromise({
				try: () =>
					callSelect<{ user_id: string; username: string }>(client, "user_public", {
						cols: "user_id, username",
						in: { col: "user_id", vals: userIds },
					}),
				catch: (err) =>
					new Error(`Failed to fetch usernames: ${extractErrorMessage(err, "Unknown error")}`),
			}),
		);

		const userDataMap = new Map((usersRes.data ?? []).map((user) => [user.user_id, user.username]));

		return rawMembersData.map((member) => {
			const username = userDataMap.get(member.user_id);
			const enrichedMember = cloneCommunityRow(member);
			if (username !== undefined) {
				enrichedMember.username = username;
			}
			enrichedMember.role = member.user_id === ownerId ? "owner" : member.role;
			return enrichedMember;
		});
	});
}
