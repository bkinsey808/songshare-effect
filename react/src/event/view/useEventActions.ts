import { Effect as EffectRuntime, type Effect } from "effect";
import { useState } from "react";

import type { EventEntry } from "@/react/event/event-types";

type UseEventActionsParams = {
	currentEvent: EventEntry | undefined;
	currentUserId: string | undefined;
	currentUsername: string | undefined;
	setCurrentEvent: (event: EventEntry | undefined) => void;
	joinEvent: (eventId: string) => Effect.Effect<void, unknown>;
	leaveEvent: (eventId: string, userId: string) => Effect.Effect<void, unknown>;
};

type EventActionsState = {
	actionLoading: boolean;
	actionError: string | undefined;
	actionSuccess: string | undefined;
	handleJoinEvent: () => void;
	handleLeaveEvent: () => void;
	clearActionError: () => void;
	clearActionSuccess: () => void;
};

/**
 * Manages join/leave action state and handlers for the event view.
 *
 * @param params - Event context and store actions used by join/leave handlers
 * @returns Action state and callbacks for event participation buttons
 */
export default function useEventActions(
	params: Readonly<UseEventActionsParams>,
): EventActionsState {
	const { currentEvent, currentUserId, currentUsername, setCurrentEvent, joinEvent, leaveEvent } =
		params;
	const [actionLoading, setActionLoading] = useState(false);
	const [actionError, setActionError] = useState<string | undefined>(undefined);
	const [actionSuccess, setActionSuccess] = useState<string | undefined>(undefined);

	function handleJoinEvent(): void {
		if (currentEvent === undefined) {
			return;
		}

		setActionLoading(true);
		setActionError(undefined);
		setActionSuccess(undefined);

		const event = currentEvent;
		const eventId = event.event_id;

		async function runJoin(): Promise<void> {
			try {
				await EffectRuntime.runPromise(joinEvent(eventId));
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : "Failed to join event";
				setActionError(message);
				setActionLoading(false);
				return;
			}

			if (currentUserId !== undefined && currentUserId !== "") {
				const existingParticipants = event.participants ?? [];
				const hasCurrentUser = existingParticipants.some(
					(participant) => participant.user_id === currentUserId,
				);

				const nextParticipants = hasCurrentUser
					? existingParticipants.map((participant) =>
							participant.user_id === currentUserId && currentUsername !== undefined
								? { ...participant, username: currentUsername }
								: participant,
						)
					: [
							...existingParticipants,
							{
								event_id: event.event_id,
								user_id: currentUserId,
								role: "participant",
								joined_at: new Date().toISOString(),
								...(currentUsername === undefined ? {} : { username: currentUsername }),
							},
						];

				setCurrentEvent({
					...event,
					participants: nextParticipants,
				});
			}

			setActionSuccess("Successfully joined the event!");
			setActionLoading(false);
		}

		void runJoin();
	}

	function handleLeaveEvent(): void {
		if (currentEvent === undefined || currentUserId === undefined) {
			return;
		}

		setActionLoading(true);
		setActionError(undefined);
		setActionSuccess(undefined);

		const event = currentEvent;
		const eventId = event.event_id;
		const userId = currentUserId;

		async function runLeave(): Promise<void> {
			try {
				await EffectRuntime.runPromise(leaveEvent(eventId, userId));
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : "Failed to leave event";
				setActionError(message);
				setActionLoading(false);
				return;
			}

			const existingParticipants = event.participants ?? [];
			setCurrentEvent({
				...event,
				participants: existingParticipants.filter((participant) => participant.user_id !== userId),
			});
			setActionSuccess("Successfully left the event!");
			setActionLoading(false);
		}

		void runLeave();
	}

	return {
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
