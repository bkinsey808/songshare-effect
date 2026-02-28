import type { Effect } from "effect";

/**
 * A community invitation pending acceptance or decline.
 */
export type PendingCommunityInvitation = {
	community_id: string;
	community_name: string;
	community_slug: string;
	/** Set after the user accepts — used to show a "Visit community" link. */
	accepted?: boolean;
};

/**
 * An event invitation pending acceptance or decline.
 */
export type PendingEventInvitation = {
	event_id: string;
	event_name: string;
	event_slug: string;
	/** Set after the user accepts — used to show a "Visit event" link. */
	accepted?: boolean;
};

/**
 * Pure state shape for the InvitationSlice.
 */
export type InvitationState = {
	pendingCommunityInvitations: readonly PendingCommunityInvitation[];
	pendingEventInvitations: readonly PendingEventInvitation[];
	isInvitationLoading: boolean;
	invitationError: string | undefined;
};

/**
 * Full Zustand slice for invitation management.
 */
export type InvitationSlice = InvitationState & {
	// Setters
	setPendingCommunityInvitations: (invitations: readonly PendingCommunityInvitation[]) => void;
	setPendingEventInvitations: (invitations: readonly PendingEventInvitation[]) => void;
	setInvitationLoading: (loading: boolean) => void;
	setInvitationError: (error: string | undefined) => void;

	// Async actions
	fetchPendingInvitations: () => Effect.Effect<void, Error>;
	acceptCommunityInvitation: (communityId: string) => Effect.Effect<void, Error>;
	declineCommunityInvitation: (communityId: string) => Effect.Effect<void, Error>;
	acceptEventInvitation: (eventId: string) => Effect.Effect<void, Error>;
	declineEventInvitation: (eventId: string, userId: string) => Effect.Effect<void, Error>;
};
