import type { ReactElement } from "react";

import EventForm from "../event/edit/EventForm";

/**
 * Page wrapper that renders the event edit form used for creating and
 * editing events.
 *
 * @returns A React element containing the EventForm
 */
export default function EventEditPage(): ReactElement {
	return <EventForm />;
}
