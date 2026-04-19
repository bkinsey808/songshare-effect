import { Effect } from "effect";
import { type TFunction } from "i18next";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/lib/form/useAppForm";
import useFormChanges from "@/react/lib/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { eventViewPath } from "@/shared/paths";
import { clientLocalDateToUtcTimestamp } from "@/shared/utils/date/formatEventDate";
import { type ValidationError } from "@/shared/validation/validate-types";

import type { EventFormValues, EventFormValuesFromSchema, SaveEventRequest } from "../event-types";
import eventFormSchema from "../form/eventFormSchema";

const NAVIGATE_BACK = -1;

export type UseEventFormReturn = {
	getFieldError: (field: keyof EventFormValues) => ValidationError | undefined;
	isSubmitting: boolean;
	isLoadingData: boolean;

	// Form State
	formValues: EventFormValues;
	setFormValue: (field: keyof EventFormValues, value: string | boolean | undefined) => void;

	// Handlers
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
	handleFormSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
	resetForm: () => void;

	// Specific Handlers
	handleNameChange: (value: string) => void;
	handleDescriptionChange: (value: string) => void;
	handleDateChange: (value: string) => void;
	handleIsPublicChange: (value: boolean) => void;
	handlePlaylistSelect: (playlistId: string) => void;
	setEventSlug: (value: string) => void;
	setPublicNotes: (value: string) => void;
	setPrivateNotes: (value: string) => void;
	handleCancel: () => void;

	// UI State/Helpers
	isEditing: boolean;
	submitLabel: string;
	error: string | undefined;
	hasUnsavedChanges: boolean;
	isSaving: boolean;
	t: TFunction;
};

/**
 * Manages event form state and behavior in the edit/create flow.
 *
 * - Tracks form values, submission state, and unsaved changes
 * - Provides handlers for form field changes and submission
 * - Validates event data using eventSchema
 *
 * @returns An object containing form state, handlers, and UI helpers
 */
export default function useEventForm(): UseEventFormReturn {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { event_id, lang } = useParams<{ event_id: string; lang: string }>();
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;

	const formRef = useRef<HTMLFormElement | null>(null);

	// App Store
	const storeIsLoading = useAppStore((state) => state.isEventLoading);
	const isSaving = useAppStore((state) => state.isEventSaving);
	const storeError = useAppStore((state) => state.eventError);
	const saveEvent = useAppStore((state) => state.saveEvent);

	const isEditing = event_id !== undefined && event_id !== "";
	const [isLoadingData] = useState(false);

	// Controlled form field values
	const [formValues, setFormValuesState] = useState<EventFormValues>({
		event_id: event_id,
		event_name: "",
		event_slug: "",
		event_description: "",
		event_date: "",
		is_public: false,
		active_playlist_id: undefined,
		public_notes: "",
		private_notes: "",
	});

	/**
	 * Update a single form field value and sync it to the underlying DOM input
	 * when available.
	 *
	 * @param field - field key to update
	 * @param value - new value for the field
	 * @returns void
	 */
	function setFormValue(field: keyof EventFormValues, value: string | boolean | undefined): void {
		setFormValuesState((prev) => ({ ...prev, [field]: value }));
		if (formRef.current && typeof value === "string") {
			setFieldValue(formRef.current, field, value);
		}
	}

	// Form Changes Tracking
	const { hasUnsavedChanges: hasUnsavedChangesFn, clearInitialState } =
		useFormChanges<EventFormValues>({
			currentState: formValues,
			enabled: !isLoadingData,
		});

	// Initial Values for Validation
	const initialValues: Partial<EventFormValuesFromSchema> = {
		event_id: event_id,
		event_name: "",
		event_slug: "",
		event_description: "",
		event_date: "",
		is_public: false,
		active_playlist_id: undefined,
		public_notes: "",
		private_notes: "",
	};

	const { getFieldError, handleSubmit, isSubmitting } = useAppForm<EventFormValuesFromSchema>({
		schema: eventFormSchema,
		formRef,
		initialValues,
	});

	/**
	 * Handle name input changes and auto-generate a slug for new events.
	 *
	 * @param value - new name value
	 * @returns void
	 */
	function handleNameChange(value: string): void {
		setFormValue("event_name", value);
		if (!isEditing) {
			setFormValue("event_slug", generateSlug(value));
		}
	}

	/**
	 * Form submit handler that validates and persists the event via the
	 * `saveEvent` action.
	 *
	 * @param event - optional form submit event
	 * @returns Promise<void>
	 */
	// oxlint-disable-next-line typescript/no-deprecated
	function handleFormSubmit(event?: React.FormEvent<HTMLFormElement>): Promise<void> {
		if (event) {
			event.preventDefault();
		}

		return Effect.runPromise(
			handleSubmit(formValues, async () => {
				const request: SaveEventRequest = {
					event_name: formValues.event_name,
					event_slug: formValues.event_slug,
				};

				if (isEditing && formValues.event_id !== undefined && formValues.event_id !== "") {
					request.event_id = formValues.event_id;
				}

				if (formValues.event_description !== undefined && formValues.event_description !== "") {
					request.event_description = formValues.event_description;
				}

				if (formValues.event_date !== undefined && formValues.event_date !== "") {
					// Convert from local time (YYYY/MM/DD HH:mm) to UTC ISO 8601 for database storage
					const utcTimestamp = clientLocalDateToUtcTimestamp(formValues.event_date);
					if (utcTimestamp !== undefined) {
						request.event_date = utcTimestamp;
					}
				}

				if (formValues.is_public === true) {
					request.is_public = formValues.is_public;
				}

				if (formValues.active_playlist_id !== undefined) {
					request.active_playlist_id = formValues.active_playlist_id;
				}

				if (formValues.public_notes !== undefined && formValues.public_notes !== "") {
					request.public_notes = formValues.public_notes;
				}

				if (formValues.private_notes !== undefined && formValues.private_notes !== "") {
					request.private_notes = formValues.private_notes;
				}

				const result = await Effect.runPromise(saveEvent(request));

				if (result) {
					clearInitialState();
					void navigate(
						buildPathWithLang(`/${eventViewPath}/${formValues.event_slug}`, langForNav),
					);
				}
			}),
		);
	}

	/**
	 * Update event description field.
	 *
	 * @param value - new description text
	 * @returns void
	 */
	function handleDescriptionChange(value: string): void {
		setFormValue("event_description", value);
	}

	/**
	 * Update event date field (local timestamp string).
	 *
	 * @param value - date/time string
	 * @returns void
	 */
	function handleDateChange(value: string): void {
		// Accept YYYY/MM/DD HH:mm format directly
		setFormValue("event_date", value);
	}

	/**
	 * Toggle the event public flag.
	 *
	 * @param value - boolean indicating public visibility
	 * @returns void
	 */
	function handleIsPublicChange(value: boolean): void {
		setFormValue("is_public", value);
	}

	/**
	 * Handle selection of an active playlist for the event.
	 *
	 * @param playlistId - selected playlist id (empty string clears)
	 * @returns void
	 */
	function handlePlaylistSelect(playlistId: string): void {
		const idOrUndefined = playlistId === "" ? undefined : playlistId;
		setFormValue("active_playlist_id", idOrUndefined);
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
	 * Update the public notes field.
	 *
	 * @param value - public notes text
	 * @returns void
	 */
	function setPublicNotes(value: string): void {
		setFormValue("public_notes", value);
	}

	/**
	 * Update the private notes field.
	 *
	 * @param value - private notes text
	 * @returns void
	 */
	function setPrivateNotes(value: string): void {
		setFormValue("private_notes", value);
	}

	/**
	 * Cancel editing and navigate back.
	 *
	 * @returns void
	 */
	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
	}

	/**
	 * Reset the form to initial empty values and clear unsaved changes.
	 *
	 * @returns void
	 */
	function resetForm(): void {
		setFormValuesState({
			event_id: event_id,
			event_name: "",
			event_slug: "",
			event_description: "",
			event_date: "",
			is_public: false,
			active_playlist_id: undefined,
			public_notes: "",
			private_notes: "",
		});
		clearInitialState();
	}

	let submitLabel = "";
	if (isSaving || isSubmitting) {
		submitLabel = t("eventEdit.saving", "Saving...");
	} else if (isEditing) {
		submitLabel = t("eventEdit.submitLabel", "Save Event");
	} else {
		submitLabel = t("eventEdit.submitLabelCreate", "Create Event");
	}

	return {
		formValues,
		setFormValue,
		handleFormSubmit,
		formRef,
		resetForm,
		handleNameChange,
		handleDescriptionChange,
		handleDateChange,
		handleIsPublicChange,
		handlePlaylistSelect,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		handleCancel,
		isEditing,
		submitLabel,
		error: storeError,
		hasUnsavedChanges: hasUnsavedChangesFn(),
		isSaving: isSubmitting || isSaving || storeIsLoading,
		isLoadingData,
		getFieldError,
		isSubmitting,
		t,
	};
}
