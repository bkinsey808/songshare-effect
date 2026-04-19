import { useEffect, useMemo } from "react";

import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";
import type { EventFormValues, EventFormValuesFromSchema } from "@/react/event/event-types";
import useFormChanges from "@/react/lib/form/useFormChanges";

import getDefaultEventFormValues from "../getDefaultEventFormValues";
import useSyncActiveSongSelection from "../useSyncActiveSongSelection";
import useEventFormValues from "./useEventFormValues";

type UseEventFormStateParams = {
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly eventId: string | undefined;
	readonly tags: readonly string[];
	readonly isEditing: boolean;
	readonly currentEvent: EventEntry | undefined;
};

type UseEventFormStateReturn = {
	formValues: EventFormValues;
	setFormValue: (
		field: keyof EventFormValues,
		value: string | number | boolean | undefined,
	) => void;
	handleNameChange: (value: string) => void;
	handleDescriptionChange: (value: string) => void;
	handleDateChange: (value: string) => void;
	handleIsPublicChange: (value: boolean) => void;
	handlePlaylistSelect: (playlistId: string) => void;
	handleActiveSongSelect: (songId: string) => void;
	handleActiveSlidePositionSelect: (slidePosition: number) => void;
	setEventSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;
	resetForm: () => void;
	hasUnsavedChanges: boolean;
	initialValues: Partial<EventFormValuesFromSchema>;
	clearInitialState: () => void;
};

/**
 * Hook that manages Event form state, change tracking, and synchronization.
 *
 * @param formRef - Ref to the backing DOM form used for FormData submission
 * @param eventId - Event id being edited (undefined for new events)
 * @param tags - current tag list
 * @param isEditing - whether we are in edit mode
 * @param currentEvent - persisted event record from store
 * @returns Event form state and mutation helpers
 */
export default function useEventFormState({
	formRef,
	eventId,
	tags,
	isEditing,
	currentEvent,
}: UseEventFormStateParams): UseEventFormStateReturn {
	const {
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
	} = useEventFormValues({
		formRef,
		eventId,
	});

	useSyncActiveSongSelection({
		formValues,
		setFormValuesState,
	});

	// Hydrates edit-mode form fields from the persisted current event snapshot.
	useEffect(() => {
		if (
			!isEditing ||
			currentEvent === undefined ||
			currentEvent.event_id !== eventId ||
			currentEvent.public === undefined
		) {
			return;
		}

		setFormValuesState({
			event_id: eventId ?? "",
			event_name: currentEvent.public.event_name,
			event_slug: currentEvent.public.event_slug,
			event_description: currentEvent.public.event_description ?? "",
			event_date: currentEvent.public.event_date ?? "",
			is_public: currentEvent.public.is_public ?? false,
			active_playlist_id: currentEvent.public.active_playlist_id ?? undefined,
			active_song_id: currentEvent.public.active_song_id ?? undefined,
			active_slide_position: currentEvent.public.active_slide_position ?? undefined,
			public_notes: currentEvent.public.public_notes ?? "",
			private_notes: currentEvent.private_notes ?? "",
			tags: [...tags],
		});
	}, [currentEvent, eventId, isEditing, setFormValuesState, tags]);

	// Form Changes Tracking
	const { hasUnsavedChanges, clearInitialState } = useFormChanges<EventFormValues>({
		currentState: formValues,
		enabled: true,
	});

	// Initial Values for Validation
	const initialValues = useMemo(() => getDefaultEventFormValues(eventId), [eventId]);

	/**
	 * Reset the form values to defaults and clear unsaved-change tracking.
	 *
	 * @returns void
	 */
	function resetForm(): void {
		resetFormValues();
		clearInitialState();
	}

	return {
		formValues,
		setFormValue,
		handleNameChange: (value: string) => {
			handleNameChange(value, isEditing);
		},
		handleDescriptionChange,
		handleDateChange,
		handleIsPublicChange,
		handlePlaylistSelect,
		handleActiveSongSelect,
		handleActiveSlidePositionSelect,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		resetForm,
		hasUnsavedChanges: hasUnsavedChanges(),
		initialValues,
		clearInitialState,
	};
}
