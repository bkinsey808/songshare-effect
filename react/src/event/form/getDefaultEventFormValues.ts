import type { EventFormValues } from "../event-types";

/**
 * Creates default event form values for create/edit flows.
 *
 * @param eventId - Optional event ID for edit mode
 * @returns Default form values object
 */
export default function getDefaultEventFormValues(eventId: string | undefined): EventFormValues {
	return {
		event_id: eventId,
		event_name: "",
		event_slug: "",
		event_description: "",
		event_date: "",
		is_public: false,
		active_playlist_id: undefined,
		active_song_id: undefined,
		active_slide_id: undefined,
		public_notes: "",
		private_notes: "",
	};
}
