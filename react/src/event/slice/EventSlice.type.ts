import type { Effect } from "effect";

import type { EventError } from "../event-errors";
import type { EventSliceBase, SaveEventRequest } from "../event-types";

export type EventSlice = EventSliceBase & {
	/** Fetch an event by slug */
	fetchEventBySlug: (eventSlug: string) => Effect.Effect<void, EventError>;
	/** Save an event (create or update) */
	saveEvent: (request: Readonly<SaveEventRequest>) => Effect.Effect<string, EventError>;
	/** Join the current user to an event */
	joinEvent: (eventId: string) => Effect.Effect<void, EventError>;
	/** Leave an event as the given user */
	leaveEvent: (eventId: string, userId: string) => Effect.Effect<void, EventError>;
	/** Clear the current event from state */
	clearCurrentEvent: () => void;
};
