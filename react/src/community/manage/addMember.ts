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
 * Add or invite a member to a community.
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
