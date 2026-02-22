// ReactElement is ambient; no import needed

import EventForm from "../event/form/EventForm";

/**
 * Page wrapper that renders the event edit form used for creating and
 * editing events.
 *
 * @returns A React element containing the EventForm
 */
export default function EventEditPage(): ReactElement {
	return <EventForm />;
}
