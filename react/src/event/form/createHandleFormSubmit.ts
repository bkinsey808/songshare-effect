import type React from "react";

import type { EventFormValues, SaveEventRequest } from "../event-types";

import buildSaveEventRequest from "./buildSaveEventRequest";

type CreateHandleFormSubmitArgs = {
	formValues: EventFormValues;
	isEditing: boolean;
	runValidatedSubmit: (onSubmitValid: () => Promise<void>) => Promise<void>;
	runSaveEvent: (request: SaveEventRequest) => Promise<string>;
	clearInitialState: () => void;
	navigateToEvent: (slug: string) => void;
};

/**
 * Creates the submit handler for the event form.
 *
 * @param formValues - Current form values
 * @param isEditing - Whether form is in edit mode
 * @param runValidatedSubmit - Validation runner that executes submit side effects when valid
 * @param runSaveEvent - Async save request executor
 * @param clearInitialState - Resets unsaved-change tracking baseline
 * @param navigateToEvent - Navigation callback on successful save
 * @returns Form submit handler
 */
export default function createHandleFormSubmit({
	formValues,
	isEditing,
	runValidatedSubmit,
	runSaveEvent,
	clearInitialState,
	navigateToEvent,
}: CreateHandleFormSubmitArgs): (
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	event?: React.FormEvent<HTMLFormElement>,
) => Promise<void> {
	/**
	 * Validates and submits event form values.
	 *
	 * @param event - Optional form submit event
	 * @returns Promise that resolves when submission flow completes
	 */
	return async function handleFormSubmit(
		// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
		event?: React.FormEvent<HTMLFormElement>,
	): Promise<void> {
		if (event) {
			event.preventDefault();
		}

		await runValidatedSubmit(async () => {
			const request: SaveEventRequest = buildSaveEventRequest(formValues, isEditing);
			const eventId = await runSaveEvent(request);

			if (eventId !== "") {
				clearInitialState();
				navigateToEvent(formValues.event_slug);
			}
		});
	};
}
