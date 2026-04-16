import { Effect } from "effect";
import { vi } from "vitest";

import type { InvitationSlice } from "./InvitationSlice.type";

/**
 * Create a minimal InvitationSlice test double. Tests pass spies/overrides
 * to assert behavior; defaults are no-op spies.
 *
 * @param overrides - Partial overrides to replace default spies and values
 * @returns InvitationSlice - test double implementing the slice
 */
export default function makeInvitationSlice(overrides?: Partial<InvitationSlice>): InvitationSlice {
	const setPendingCommunityInvitations = overrides?.setPendingCommunityInvitations ?? vi.fn();
	const setPendingEventInvitations = overrides?.setPendingEventInvitations ?? vi.fn();
	const setInvitationLoading = overrides?.setInvitationLoading ?? vi.fn();
	const setInvitationError = overrides?.setInvitationError ?? vi.fn();

	/**
	 * Fetch pending invitations (test double).
	 *
	 * @returns Effect that resolves to void in tests
	 */
	function fetchPendingInvitations(): ReturnType<InvitationSlice["fetchPendingInvitations"]> {
		return Effect.succeed<void>(undefined) as ReturnType<
			InvitationSlice["fetchPendingInvitations"]
		>;
	}

	/**
	 * Accept a community invitation (test double).
	 *
	 * @param _communityId - community id to accept
	 * @returns Effect resolving to void
	 */
	function acceptCommunityInvitation(
		_communityId: string,
	): ReturnType<InvitationSlice["acceptCommunityInvitation"]> {
		return Effect.succeed<void>(undefined) as ReturnType<
			InvitationSlice["acceptCommunityInvitation"]
		>;
	}

	/**
	 * Decline a community invitation (test double).
	 *
	 * @param _communityId - community id to decline
	 * @returns Effect resolving to void
	 */
	function declineCommunityInvitation(
		_communityId: string,
	): ReturnType<InvitationSlice["declineCommunityInvitation"]> {
		return Effect.succeed<void>(undefined) as ReturnType<
			InvitationSlice["declineCommunityInvitation"]
		>;
	}

	/**
	 * Accept an event invitation (test double).
	 *
	 * @param _eventId - event id to accept
	 * @returns Effect resolving to void
	 */
	function acceptEventInvitation(
		_eventId: string,
	): ReturnType<InvitationSlice["acceptEventInvitation"]> {
		return Effect.succeed<void>(undefined) as ReturnType<InvitationSlice["acceptEventInvitation"]>;
	}

	/**
	 * Decline an event invitation (test double).
	 *
	 * @param _eventId - event id to decline
	 * @param _userId - user id performing the decline
	 * @returns Effect resolving to void
	 */
	function declineEventInvitation(
		_eventId: string,
		_userId: string,
	): ReturnType<InvitationSlice["declineEventInvitation"]> {
		return Effect.succeed<void>(undefined) as ReturnType<InvitationSlice["declineEventInvitation"]>;
	}

	return {
		pendingCommunityInvitations: overrides?.pendingCommunityInvitations ?? [],
		pendingEventInvitations: overrides?.pendingEventInvitations ?? [],
		isInvitationLoading: overrides?.isInvitationLoading ?? false,
		invitationError: overrides?.invitationError ?? undefined,
		setPendingCommunityInvitations,
		setPendingEventInvitations,
		setInvitationLoading,
		setInvitationError,
		fetchPendingInvitations,
		acceptCommunityInvitation,
		declineCommunityInvitation,
		acceptEventInvitation,
		declineEventInvitation,
	};
}
