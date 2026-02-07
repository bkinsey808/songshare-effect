import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import type { EventEntry } from "@/react/event/event-types";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";

/**
 * Hook for managing event view state and actions.
 *
 * Handles fetching event details, auto-joining participants, and managing join/leave actions.
 *
 * @returns Object containing event state, participant info, and action handlers
 */
export default function useEventView(): {
	event_slug: string | undefined;
	currentEvent: EventEntry | undefined;
	isEventLoading: boolean;
	eventError: string | undefined;
	isParticipant: boolean;
	currentUserId: string | undefined;
	actionLoading: boolean;
	actionError: string | undefined;
	actionSuccess: string | undefined;
	handleJoinEvent: () => void;
	handleLeaveEvent: () => void;
	clearActionError: () => void;
	clearActionSuccess: () => void;
} {
	const { event_slug } = useParams<{ event_slug: string }>();

	// App store state and methods
	const currentEvent = useAppStore((state) => state.currentEvent);
	const isEventLoading = useAppStore((state) => state.isEventLoading);
	const eventError = useAppStore((state) => state.eventError);
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const appStoreJoinEvent = useAppStore((state) => state.joinEvent);
	const appStoreLeaveEvent = useAppStore((state) => state.leaveEvent);

	// Auth and participation
	const currentUserId = useCurrentUserId();

	// Join/leave action state
	const [actionLoading, setActionLoading] = useState(false);
	const [actionError, setActionError] = useState<string | undefined>(undefined);
	const [actionSuccess, setActionSuccess] = useState<string | undefined>(undefined);
	const autoJoinAttempted = useRef(false);

	// Detect if current user is a participant
	const participants = currentEvent?.participants ?? [];
	const isParticipant =
		currentUserId !== undefined && currentUserId !== ""
			? participants.some((participant) => participant.user_id === currentUserId)
			: false;

	// Fetch event on mount or when slug changes
	useEffect(() => {
		if (event_slug === undefined || event_slug === "") {
			return;
		}

		void Effect.runPromise(fetchEventBySlug(event_slug));
	}, [event_slug, fetchEventBySlug]);

	// Auto-join authenticated users when they visit the event link
	useEffect(() => {
		// Only proceed if event is loaded, user is authenticated, and we haven't tried yet
		if (
			isEventLoading ||
			currentEvent === undefined ||
			currentUserId === undefined ||
			currentUserId === "" ||
			autoJoinAttempted.current
		) {
			return;
		}

		// Check if user needs to join (not already a participant)
		const currentParticipants = currentEvent.participants ?? [];
		const userIsParticipant = currentParticipants.some(
			(participant) => participant.user_id === currentUserId,
		);

		if (userIsParticipant) {
			// User is already a participant, no need to auto-join
			autoJoinAttempted.current = true;
			return;
		}

		// Auto-join the user
		autoJoinAttempted.current = true;
		void Effect.runPromise(appStoreJoinEvent(currentEvent.event_id));
	}, [isEventLoading, currentEvent, currentUserId, appStoreJoinEvent]);

	/**
	 * Handles join event action with loading and error state management.
	 */
	// oxlint-disable promise/prefer-await-to-then
	function handleJoinEvent(): void {
		if (currentEvent === undefined) {
			return;
		}
		setActionLoading(true);
		setActionError(undefined);
		setActionSuccess(undefined);

		void Effect.runPromise(appStoreJoinEvent(currentEvent.event_id))
			.then(() => {
				setActionSuccess("Successfully joined the event!");
				return undefined;
			})
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message : "Failed to join event";
				setActionError(message);
			})
			.finally(() => {
				setActionLoading(false);
			});
	}

	/**
	 * Handles leave event action with loading and error state management.
	 */
	// oxlint-disable promise/prefer-await-to-then
	function handleLeaveEvent(): void {
		if (currentEvent === undefined || currentUserId === undefined) {
			return;
		}
		setActionLoading(true);
		setActionError(undefined);
		setActionSuccess(undefined);

		void Effect.runPromise(appStoreLeaveEvent(currentEvent.event_id, currentUserId))
			.then(() => {
				setActionSuccess("Successfully left the event!");
				return undefined;
			})
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message : "Failed to leave event";
				setActionError(message);
			})
			.finally(() => {
				setActionLoading(false);
			});
	}

	return {
		event_slug,
		currentEvent,
		isEventLoading,
		eventError,
		isParticipant,
		currentUserId,
		actionLoading,
		actionError,
		actionSuccess,
		handleJoinEvent,
		handleLeaveEvent,
		clearActionError: () => {
			setActionError(undefined);
		},
		clearActionSuccess: () => {
			setActionSuccess(undefined);
		},
	};
}
