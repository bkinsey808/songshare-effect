import { Effect } from "effect";
import { useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
// language is intentionally left to the consuming component

import type {
    PendingCommunityInvitation,
    PendingEventInvitation,
} from "../slice/InvitationSlice.type";

type PendingInvitationSectionHook = {
	pendingCommunityInvitations: readonly PendingCommunityInvitation[];
	pendingEventInvitations: readonly PendingEventInvitation[];
	invitationError: string | undefined;
	hasInvitations: boolean;
	acceptingCommunityId: string | undefined;
	acceptingEventId: string | undefined;
	handleAcceptCommunity: (communityId: string) => void;
	handleDeclineCommunity: (communityId: string) => void;
	handleAcceptEvent: (eventId: string) => void;
	handleDeclineEvent: (eventId: string) => void;
};

/**
 * Provides pending-invitation state and UI-friendly handlers for the
 * `PendingInvitationsSection` component.
 *
 * - Reads the invitation lists and any invitation-related error from the
 *   global app store.
 * - Returns simple handler functions that invoke the underlying Effect
 *   actions so the component can attach them directly to `onClick`.
 *
 * @returns pendingCommunityInvitations - read-only community invitations array
 * @returns pendingEventInvitations - read-only event invitations array
 * @returns invitationError - optional error message to show in the UI
 * @returns hasInvitations - true when there are any pending invitations
 * @returns handleAcceptCommunity - accepts a community invitation by id
 * @returns handleDeclineCommunity - declines a community invitation by id
 * @returns handleAcceptEvent - accepts an event invitation by id
 * @returns handleDeclineEvent - declines an event invitation by id (uses current user id)
 */
export default function usePendingInvitationSection(): PendingInvitationSectionHook {
	// language is handled by the consuming component via useCurrentLang
	const pendingCommunityInvitations = useAppStore((state) => state.pendingCommunityInvitations);
	const pendingEventInvitations = useAppStore((state) => state.pendingEventInvitations);
	const acceptCommunityInvitation = useAppStore((state) => state.acceptCommunityInvitation);
	const declineCommunityInvitation = useAppStore((state) => state.declineCommunityInvitation);
	const acceptEventInvitation = useAppStore((state) => state.acceptEventInvitation);
	const declineEventInvitation = useAppStore((state) => state.declineEventInvitation);
	const invitationError = useAppStore((state) => state.invitationError);
	const userSessionData = useAppStore((state) => state.userSessionData);

	const [acceptingCommunityId, setAcceptingCommunityId] = useState<string | undefined>(undefined);
	const [acceptingEventId, setAcceptingEventId] = useState<string | undefined>(undefined);

	const minInvitations = 0;
	const hasInvitations =
		pendingCommunityInvitations.length > minInvitations ||
		pendingEventInvitations.length > minInvitations;

	/**
	 * Accept a pending community invitation by id.
	 *
	 * @param communityId - id of the community to accept
	 * @returns void
	 */
	function handleAcceptCommunity(communityId: string): void {
		setAcceptingCommunityId(communityId);
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(acceptCommunityInvitation(communityId));
			} catch (error) {
				setAcceptingCommunityId(undefined);
				throw error;
			}
			setAcceptingCommunityId(undefined);
		})();
	}

	/**
	 * Decline a pending community invitation.
	 *
	 * @param communityId - id of the community to decline
	 * @returns void
	 */
	function handleDeclineCommunity(communityId: string): void {
		void Effect.runPromise(declineCommunityInvitation(communityId));
	}

	/**
	 * Accept a pending event invitation by id.
	 *
	 * @param eventId - id of the event to accept
	 * @returns void
	 */
	function handleAcceptEvent(eventId: string): void {
		setAcceptingEventId(eventId);
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(acceptEventInvitation(eventId));
			} catch (error) {
				setAcceptingEventId(undefined);
				throw error;
			}
			setAcceptingEventId(undefined);
		})();
	}

	/**
	 * Decline a pending event invitation.
	 *
	 * @param eventId - id of the event to decline
	 * @returns void
	 */
	function handleDeclineEvent(eventId: string): void {
		const currentUserId = userSessionData?.user.user_id;
		if (currentUserId !== undefined) {
			void Effect.runPromise(declineEventInvitation(eventId, currentUserId));
		}
	}

	return {
		pendingCommunityInvitations,
		pendingEventInvitations,
		invitationError,
		hasInvitations,
		acceptingCommunityId,
		acceptingEventId,
		handleAcceptCommunity,
		handleDeclineCommunity,
		handleAcceptEvent,
		handleDeclineEvent,
	};
}
