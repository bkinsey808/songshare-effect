import { Effect } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

import subscribeToPendingInvitations from "./subscribeToPendingInvitations";

/**
 * Hook to manage invitation subscriptions and initial data fetching.
 *
 * On mount, if a user is signed in:
 * 1. Fetches initial pending invitations (community & event)
 * 2. Sets up a Supabase Realtime subscription for future invitation changes
 *
 * Automatically keeps the invitation slice state up-to-date.
 */
export default function useInvitationSubscription(): void {
	const userSessionData = useAppStore((state) => state.userSessionData);
	const fetchPendingInvitations = useAppStore((state) => state.fetchPendingInvitations);
	const setPendingCommunityInvitations = useAppStore(
		(state) => state.setPendingCommunityInvitations,
	);
	const setPendingEventInvitations = useAppStore((state) => state.setPendingEventInvitations);

	const userId = userSessionData?.user.user_id;

	// Initial fetch
	useEffect(() => {
		if (userId === undefined) {
			// Clear state if not signed in
			setPendingCommunityInvitations([]);
			setPendingEventInvitations([]);
			return;
		}

		void Effect.runPromise(fetchPendingInvitations());
	}, [userId, fetchPendingInvitations, setPendingCommunityInvitations, setPendingEventInvitations]);

	// Realtime subscription
	useEffect(() => {
		if (userId === undefined) {
			return undefined;
		}

		const subscribeCleanup = subscribeToPendingInvitations(userId, useAppStore.getState);

		return (): void => {
			subscribeCleanup();
		};
	}, [userId]);
}
