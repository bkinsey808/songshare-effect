import { Effect } from "effect";

import { NOT_FOUND } from "@/shared/constants/shared-constants";
import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";
import { type CommunityUserJoinPayload } from "@/shared/validation/communitySchemas";

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
		const {
			setInvitationLoading,
			setInvitationError,
			setPendingCommunityInvitations,
			pendingCommunityInvitations,
		} = get();

		setInvitationLoading(true);
		setInvitationError(undefined);

		const payload: CommunityUserJoinPayload = { community_id: communityId };
		yield* $(postJson(apiCommunityUserJoinPath, payload));

		// Optimistically mark as accepted so UI can show the link immediately
		const updated = [...pendingCommunityInvitations];
		const index = updated.findIndex((inv) => inv.community_id === communityId);
		if (index !== NOT_FOUND) {
			const existing = updated[index];
			if (existing !== undefined) {
				updated[index] = { ...existing, accepted: true };
			}
		}
		setPendingCommunityInvitations(updated);
		setInvitationLoading(false);
	}).pipe(
		Effect.tapError((err) =>
			Effect.sync(() => {
				const { setInvitationError, setInvitationLoading } = get();
				setInvitationError(err.message);
				setInvitationLoading(false);
			}),
		),
	);
}
