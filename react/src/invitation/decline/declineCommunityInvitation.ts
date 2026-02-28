import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserRemovePath } from "@/shared/paths";

import type { InvitationSlice } from "../slice/InvitationSlice.type";

/**
 * Declines a community invitation by calling the remove API.
 *
 * On success, removes the invitation from the local slice.
 *
 * @param communityId - id of the community invitation to decline
 * @param get - accessor for the invitation slice helpers
 * @returns effect that completes when the decline call finishes
 */
export default function declineCommunityInvitation(
	communityId: string,
	get: () => InvitationSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* declineCommunityInvitationGen($) {
		const { setInvitationError, setPendingCommunityInvitations, pendingCommunityInvitations } =
			get();
		setInvitationError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () => postJson(apiCommunityUserRemovePath, { community_id: communityId }),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		// Remove the declined invitation from the list
		const updated = pendingCommunityInvitations.filter((inv) => inv.community_id !== communityId);
		setPendingCommunityInvitations(updated);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setInvitationError } = get();
				setInvitationError(err.message);
			}),
		),
	);
}
