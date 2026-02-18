import type { EventParticipant } from "../event-entry/EventEntry.type";

type EnsureOwnerParticipantArgs = {
	participants: readonly EventParticipant[];
	eventId: string;
	ownerId: string;
	ownerUsername: string | undefined;
	ownerJoinedAt: string;
};

/**
 * Ensures the event owner appears in the participant list as role owner.
 *
 * If an owner row exists it is normalized to owner role, and if missing a new
 * owner participant row is appended.
 *
 * @param participants - Existing participants for the event
 * @param eventId - Event id for inserted owner participant
 * @param ownerId - Owner user id
 * @param ownerUsername - Optional owner username for display
 * @param ownerJoinedAt - Timestamp to use when owner row must be created
 * @returns Participants list including an owner participant
 */
export default function ensureOwnerParticipant({
	participants,
	eventId,
	ownerId,
	ownerUsername,
	ownerJoinedAt,
}: EnsureOwnerParticipantArgs): EventParticipant[] {
	const participantsWithOwner: EventParticipant[] = [];
	for (const participant of participants) {
		if (participant.user_id !== ownerId) {
			participantsWithOwner.push(participant);
		} else if (participant.username !== undefined || ownerUsername === undefined) {
			participantsWithOwner.push({ ...participant, role: "owner" });
		} else {
			participantsWithOwner.push({ ...participant, role: "owner", username: ownerUsername });
		}
	}

	const ownerInParticipants = participantsWithOwner.some(
		(participant) => participant.user_id === ownerId,
	);

	if (!ownerInParticipants) {
		participantsWithOwner.push({
			event_id: eventId,
			user_id: ownerId,
			role: "owner",
			joined_at: ownerJoinedAt,
			...(ownerUsername === undefined ? {} : { username: ownerUsername }),
		});
	}

	return participantsWithOwner;
}
