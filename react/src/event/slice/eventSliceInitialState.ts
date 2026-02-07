import type { EventState } from "../event-types";

const eventSliceInitialState: EventState = {
	currentEvent: undefined,
	events: [],
	participants: [],
	isEventLoading: false,
	eventError: undefined,
	isEventSaving: false,
};

export default eventSliceInitialState;
