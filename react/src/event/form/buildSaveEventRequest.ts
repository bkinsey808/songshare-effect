import { clientLocalDateToUtcTimestamp } from "@/shared/utils/formatEventDate";

import type { EventFormValues, SaveEventRequest } from "../event-types";

/**
 * Builds the save request payload from form values.
 *
 * @param formValues - Current event form values
 * @param isEditing - Whether the form is editing an existing event
 * @returns Request payload for event save API
 */
export default function buildSaveEventRequest(
	formValues: EventFormValues,
	isEditing: boolean,
): SaveEventRequest {
	const request: SaveEventRequest = {
		event_name: formValues.event_name,
		event_slug: formValues.event_slug,
		is_public: formValues.is_public ?? false,
	};

	if (isEditing && formValues.event_id !== undefined && formValues.event_id !== "") {
		request.event_id = formValues.event_id;
	}

	if (formValues.event_description !== undefined && formValues.event_description !== "") {
		request.event_description = formValues.event_description;
	}

	if (formValues.event_date !== undefined && formValues.event_date !== "") {
		const utcTimestamp = clientLocalDateToUtcTimestamp(formValues.event_date);
		if (utcTimestamp !== undefined) {
			request.event_date = utcTimestamp;
		}
	}

	if (formValues.active_playlist_id !== undefined) {
		request.active_playlist_id = formValues.active_playlist_id;
	}

	if (formValues.active_song_id !== undefined) {
		request.active_song_id = formValues.active_song_id;
	}

	if (formValues.active_slide_id !== undefined) {
		request.active_slide_id = formValues.active_slide_id;
	}

	if (formValues.public_notes !== undefined && formValues.public_notes !== "") {
		request.public_notes = formValues.public_notes;
	}

	if (formValues.private_notes !== undefined && formValues.private_notes !== "") {
		request.private_notes = formValues.private_notes;
	}

	return request;
}
