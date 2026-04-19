import { useState } from "react";

import type { EventFormValues } from "@/react/event/event-types";
import generateSlug from "@/react/lib/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";

import getDefaultEventFormValues from "../getDefaultEventFormValues";

type UseEventFormValuesParams = {
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly eventId: string | undefined;
};

type UseEventFormValuesReturn = {
	formValues: EventFormValues;
	setFormValuesState: React.Dispatch<React.SetStateAction<EventFormValues>>;
	setFormValue: (
		field: keyof EventFormValues,
		value: string | number | boolean | undefined,
	) => void;
	handleNameChange: (value: string, isEditing: boolean) => void;
	handleDescriptionChange: (value: string) => void;
	handleDateChange: (value: string) => void;
	handleIsPublicChange: (value: boolean) => void;
	handlePlaylistSelect: (playlistId: string) => void;
	handleActiveSongSelect: (songId: string) => void;
	handleActiveSlidePositionSelect: (slidePosition: number) => void;
	setEventSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;
	resetFormValues: () => EventFormValues;
};

/**
 * Hook that manages controlled Event form field values and their derived helpers.
 *
 * @param formRef - Ref to the backing DOM form used for FormData submission
 * @param eventId - Event id being edited (undefined for new events)
 * @returns Controlled values plus mutation helpers for the Event form fields
 */
export default function useEventFormValues({
	formRef,
	eventId,
}: UseEventFormValuesParams): UseEventFormValuesReturn {
	const [formValues, setFormValuesState] = useState<EventFormValues>(() =>
		getDefaultEventFormValues(eventId),
	);

	/**
	 * Update a single controlled form value and mirror it on the underlying DOM form element.
	 *
	 * @param field - The form field key to update
	 * @param value - New value for the field
	 * @returns void
	 */
	function setFormValue(
		field: keyof EventFormValues,
		value: string | number | boolean | undefined,
	): void {
		setFormValuesState((previousValues: EventFormValues) => ({ ...previousValues, [field]: value }));
		if (formRef.current && typeof value === "string") {
			setFieldValue(formRef.current, field, value);
		}
	}

	/**
	 * Update the event name and auto-generate a slug when creating a new event.
	 *
	 * @param value - new event name
	 * @param isEditing - whether we are in edit mode
	 * @returns void
	 */
	function handleNameChange(value: string, isEditing: boolean): void {
		setFormValue("event_name", value);
		if (!isEditing) {
			setFormValue("event_slug", generateSlug(value));
		}
	}

	/**
	 * Update the event description field.
	 *
	 * @param value - new description
	 * @returns void
	 */
	function handleDescriptionChange(value: string): void {
		setFormValue("event_description", value);
	}

	/**
	 * Update the event date/time field.
	 *
	 * @param value - new date string
	 * @returns void
	 */
	function handleDateChange(value: string): void {
		setFormValue("event_date", value);
	}

	/**
	 * Toggle the event public flag.
	 *
	 * @param value - new is_public boolean
	 * @returns void
	 */
	function handleIsPublicChange(value: boolean): void {
		setFormValue("is_public", value);
	}

	/**
	 * Handler when the playlist selection changes; clears dependent fields when necessary.
	 *
	 * @param playlistId - selected playlist id (empty string clears)
	 * @returns void
	 */
	function handlePlaylistSelect(playlistId: string): void {
		const idOrUndefined = playlistId === "" ? undefined : playlistId;
		if (formValues.active_playlist_id !== idOrUndefined) {
			setFormValue("active_song_id", undefined);
			setFormValue("active_slide_position", undefined);
		}
		setFormValue("active_playlist_id", idOrUndefined);
	}

	/**
	 * Handler when the active song selection changes; clears slide position when song changes.
	 *
	 * @param songId - selected song id (empty string clears)
	 * @returns void
	 */
	function handleActiveSongSelect(songId: string): void {
		const idOrUndefined = songId === "" ? undefined : songId;
		if (formValues.active_song_id !== idOrUndefined) {
			setFormValue("active_slide_position", undefined);
		}
		setFormValue("active_song_id", idOrUndefined);
	}

	/**
	 * Handler to set the active slide position for the selected song.
	 *
	 * @param slidePosition - 1-based slide position
	 * @returns void
	 */
	function handleActiveSlidePositionSelect(slidePosition: number): void {
		setFormValue("active_slide_position", slidePosition);
	}

	/**
	 * Explicitly set the event slug value.
	 *
	 * @param value - slug string
	 * @returns void
	 */
	function setEventSlug(value: string): void {
		setFormValue("event_slug", value);
	}

	/**
	 * Set the public notes field value.
	 *
	 * @param value - public notes text
	 * @returns void
	 */
	function setPublicNotes(value: string): void {
		setFormValue("public_notes", value);
	}

	/**
	 * Set the private notes field value.
	 *
	 * @param value - private notes text
	 * @returns void
	 */
	function setPrivateNotes(value: string): void {
		setFormValue("private_notes", value);
	}

	/**
	 * Reset controlled field values back to their defaults.
	 *
	 * @returns The default value object that was applied
	 */
	function resetFormValues(): EventFormValues {
		const defaultValues = getDefaultEventFormValues(eventId);
		setFormValuesState(defaultValues);
		return defaultValues;
	}

	return {
		formValues,
		setFormValuesState,
		setFormValue,
		handleNameChange,
		handleDescriptionChange,
		handleDateChange,
		handleIsPublicChange,
		handlePlaylistSelect,
		handleActiveSongSelect,
		handleActiveSlidePositionSelect,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		resetFormValues,
	};
}
