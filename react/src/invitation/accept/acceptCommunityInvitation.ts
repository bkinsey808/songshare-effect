import { Effect } from "effect";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";

import type { InvitationSlice } from "../slice/InvitationSlice.type";

/**
 * Accepts a community invitation by calling the join API.
 *
 * On success, marks the invitation as accepted in the local slice so the UI
 * can display a "Visit community" link while awaiting the realtime update.
 *
 * @param communityId - id of the community invitation to accept
 * @param get - accessor for the invitation slice helpers
 * @returns effect that completes when the accept call finishes
 */
export default function acceptCommunityInvitation(
	communityId: string,
	get: () => InvitationSlice,
): Effect.Effect<void, Error> {
	return Effect.gen(function* acceptCommunityInvitationGen($) {
		const { setInvitationError, setPendingCommunityInvitations, pendingCommunityInvitations } =
			get();
		setInvitationError(undefined);

		yield* $(
			Effect.tryPromise({
				try: () => postJson(apiCommunityUserJoinPath, { community_id: communityId }),
				catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
			}),
		);

		// Optimistically mark as accepted so UI can show the link immediately
		const updated = pendingCommunityInvitations.map((inv) =>
			inv.community_id === communityId ? Object.assign(inv, { accepted: true }) : inv,
		);
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
