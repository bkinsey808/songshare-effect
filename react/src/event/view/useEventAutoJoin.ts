import { Effect as EffectRuntime, type Effect } from "effect";
import { useEffect, useRef } from "react";

import type { EventEntry } from "@/react/event/event-types";

type UseEventAutoJoinParams = {
	isEventLoading: boolean;
	currentEvent: EventEntry | undefined;
	currentUserId: string | undefined;
	joinEvent: (eventId: string) => Effect.Effect<void, unknown>;
};

/**
 * Attempts a one-time auto-join for authenticated users opening an event link.
 *
 * @param isEventLoading - Indicates whether the event is still loading
 * @param currentEvent - Current event entry used to determine join eligibility
 * @param currentUserId - Current authenticated user id
 * @param joinEvent - Action that joins the current user to the event
 * @returns Nothing; this hook performs side effects only
 */
export default function useEventAutoJoin({
	isEventLoading,
	currentEvent,
	currentUserId,
	joinEvent,
}: Readonly<UseEventAutoJoinParams>): void {
	const autoJoinAttempted = useRef(false);

	// Auto-join once when the user is authenticated and not already in the event.
	useEffect(() => {
		if (
			isEventLoading ||
			currentEvent === undefined ||
			currentUserId === undefined ||
			currentUserId === "" ||
			autoJoinAttempted.current
		) {
			return;
		}

		const currentParticipants = currentEvent.participants ?? [];
		const userIsParticipant = currentParticipants.some(
			(participant) => participant.user_id === currentUserId,
		);
		const userIsOwner = currentEvent.owner_id === currentUserId;

		if (userIsParticipant || userIsOwner) {
			autoJoinAttempted.current = true;
			return;
		}

		async function autoJoin(eventId: string): Promise<void> {
			try {
				await EffectRuntime.runPromise(joinEvent(eventId));
			} catch {
				// Error state handled by joinEvent or locally if needed
			}
		}

		autoJoinAttempted.current = true;
		void autoJoin(currentEvent.event_id);
	}, [isEventLoading, currentEvent, currentUserId, joinEvent]);
}
