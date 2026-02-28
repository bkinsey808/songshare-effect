import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import { sliceResetFns } from "@/react/app-store/slice-reset-fns";

import type {
	InvitationSlice,
	InvitationState,
	PendingCommunityInvitation,
	PendingEventInvitation,
} from "./InvitationSlice.type";

import acceptCommunityInvitationFn from "../accept/acceptCommunityInvitation";
import acceptEventInvitationFn from "../accept/acceptEventInvitation";
import declineCommunityInvitationFn from "../decline/declineCommunityInvitation";
import declineEventInvitationFn from "../decline/declineEventInvitation";
import fetchPendingInvitationsFn from "../fetchPendingInvitations";

const invitationSliceInitialState: InvitationState = {
	pendingCommunityInvitations: [],
	pendingEventInvitations: [],
	isInvitationLoading: false,
	invitationError: undefined,
};

/**
 * Factory for the Zustand invitation slice.
 *
 * Manages pending community and event invitations for the signed-in user.
 * Provides setters for realtime updates and async actions for accept/decline.
 *
 * @param set - store setter helper
 * @param get - store getter helper
 * @param api - unused API arg (required by slice interface)
 * @returns fully formed `InvitationSlice` object
 */
export default function createInvitationSlice(
	set: Set<InvitationSlice>,
	get: Get<InvitationSlice>,
	api: Api<InvitationSlice>,
): InvitationSlice {
	void api;

	sliceResetFns.add(() => {
		set(invitationSliceInitialState);
	});

	return {
		...invitationSliceInitialState,

		// Setters
		setPendingCommunityInvitations: (invitations: readonly PendingCommunityInvitation[]) => {
			set({
				pendingCommunityInvitations: invitations as ReadonlyDeep<
					readonly PendingCommunityInvitation[]
				>,
			});
		},

		setPendingEventInvitations: (invitations: readonly PendingEventInvitation[]) => {
			set({
				pendingEventInvitations: invitations as ReadonlyDeep<readonly PendingEventInvitation[]>,
			});
		},

		setInvitationLoading: (loading: boolean) => {
			set({ isInvitationLoading: loading });
		},

		setInvitationError: (error: string | undefined) => {
			set({ invitationError: error });
		},

		// Async actions
		fetchPendingInvitations: () => fetchPendingInvitationsFn(get),

		acceptCommunityInvitation: (communityId: string) =>
			acceptCommunityInvitationFn(communityId, get),

		declineCommunityInvitation: (communityId: string) =>
			declineCommunityInvitationFn(communityId, get),

		acceptEventInvitation: (eventId: string) => acceptEventInvitationFn(eventId, get),

		declineEventInvitation: (eventId: string, userId: string) =>
			declineEventInvitationFn(eventId, userId, get),
	};
}
