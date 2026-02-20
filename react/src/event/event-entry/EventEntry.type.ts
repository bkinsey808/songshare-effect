import type { Event, EventPublic, EventUser } from "../event-types";
import type { ParticipantStatus } from "../participant-status/participantStatusMachine";

export type EventParticipant = EventUser & {
	username?: string;
	participantStatus?: ParticipantStatus;
};

/**
 * Extended event type for UI with combined data.
 */
export type EventEntry = Event & {
	/** Public event data */
	public?: EventPublic;
	/** Event participants with roles */
	participants?: readonly EventParticipant[];
	/** Username of the event owner */
	owner_username?: string;
};
