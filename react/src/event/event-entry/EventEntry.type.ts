import type { Event, EventPublic, EventUser } from "../event-types";

/**
 * Extended event type for UI with combined data.
 */
export type EventEntry = Event & {
	/** Public event data */
	public?: EventPublic;
	/** Event participants with roles */
	participants?: readonly EventUser[];
	/** Username of the event owner */
	owner_username?: string;
};
