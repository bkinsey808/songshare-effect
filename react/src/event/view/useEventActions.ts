import { Effect as EffectRuntime, type Effect } from "effect";
import { useState } from "react";

import type { EventEntry } from "@/react/event/event-types";

import {
	getParticipantPermissions,
	transitionParticipantStatus,
	type ParticipantStatus,
} from "@/react/event/participant-status/participantStatusMachine";

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

type ParticipantList = NonNullable<EventEntry["participants"]>;
type MutableParticipantList = ParticipantList[number][];

/**
 * Normalizes raw status-like values into a supported participant status.
 *
 * @param status - Unknown status candidate from participant data
 * @param fallback - Status to use when the input is not recognized
 * @returns Safe participant status for state transitions
 */
function normalizeParticipantStatus(
	status: unknown,
	fallback: ParticipantStatus,
): ParticipantStatus {
	if (status === "invited" || status === "joined" || status === "left" || status === "kicked") {
		return status;
	}

	return fallback;
}

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
				const existingParticipants: ParticipantList = event.participants ?? [];
				const existingCurrentUser = existingParticipants.find(
					(participant) => participant.user_id === currentUserId,
				);
				const currentStatus = normalizeParticipantStatus(
					existingCurrentUser?.participantStatus ?? existingCurrentUser?.status,
					existingCurrentUser === undefined ? "invited" : "joined",
				);
				const nextStatus = transitionParticipantStatus(currentStatus, "join");
				if (nextStatus === currentStatus && !getParticipantPermissions(currentStatus).canJoin) {
					setActionError("You cannot join this event.");
					setActionLoading(false);
					return;
				}

				let nextParticipants: ParticipantList = existingParticipants;
				if (existingCurrentUser === undefined) {
					nextParticipants = [
						...existingParticipants,
						{
							event_id: event.event_id,
							user_id: currentUserId,
							role: "participant",
							status: nextStatus,
							participantStatus: nextStatus,
							joined_at: new Date().toISOString(),
							...(currentUsername === undefined ? {} : { username: currentUsername }),
						},
					];
				} else {
					const nextParticipantsMutable: MutableParticipantList = [];
					for (const participant of existingParticipants) {
						if (participant.user_id === currentUserId) {
							nextParticipantsMutable.push({
								...participant,
								status: nextStatus,
								participantStatus: nextStatus,
								...(currentUsername === undefined ? {} : { username: currentUsername }),
							});
						} else {
							nextParticipantsMutable.push(participant);
						}
					}
					nextParticipants = nextParticipantsMutable;
				}

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

			const existingParticipants: ParticipantList = event.participants ?? [];
			const existingCurrentUser = existingParticipants.find(
				(participant) => participant.user_id === userId,
			);
			const currentStatus = normalizeParticipantStatus(
				existingCurrentUser?.participantStatus ?? existingCurrentUser?.status,
				"joined",
			);
			const nextStatus = transitionParticipantStatus(currentStatus, "leave");
			if (nextStatus === currentStatus && !getParticipantPermissions(currentStatus).canLeave) {
				setActionError("You cannot leave this event.");
				setActionLoading(false);
				return;
			}

			const nextParticipants: MutableParticipantList = [];
			for (const participant of existingParticipants) {
				if (participant.user_id === userId) {
					nextParticipants.push({
						...participant,
						status: nextStatus,
						participantStatus: nextStatus,
					});
				} else {
					nextParticipants.push(participant);
				}
			}

			setCurrentEvent({
				...event,
				participants: nextParticipants,
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
