import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserAddPath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

type AddMemberArgs = {
	readonly communityId: string;
	readonly userId: string;
	readonly role: "community_admin" | "member";
	readonly get: () => CommunitySlice;
};

/**
 * Sends an invitation or directly adds a user to the specified community.
 *
 * The provided `role` determines whether the new member is an admin or
 * a regular member.  This operation mutates the community slice's loading
 * and error flags so callers do not have to manage them manually.
 *
 * @param communityId - id of community receiving the member
 * @param userId - id of user to add or invite
 * @param role - role to assign (`community_admin` or `member`)
 * @param get - callback returning current community slice helpers
 * @returns an effect that resolves when the server responds or fails with an error
 */
export default function addMember({
	communityId,
	userId,
	role,
	get,
}: AddMemberArgs): Effect.Effect<void, Error> {
	return Effect.gen(function* addMemberGen($) {
		const { setCommunityLoading, setCommunityError } = get();

		setCommunityLoading(true);
		setCommunityError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () =>
					postJson(apiCommunityUserAddPath, {
						community_id: communityId,
						user_id: userId,
						role,
						status: "invited",
					}),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		setCommunityLoading(false);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setCommunityLoading, setCommunityError } = get();
				setCommunityLoading(false);
				setCommunityError(err.message);
			}),
		),
	);
}
