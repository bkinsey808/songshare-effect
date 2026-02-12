import { Effect } from "effect";
import { type TFunction } from "i18next";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/form/useAppForm";
import useFormChanges from "@/react/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";
import { clientLocalDateToUtcTimestamp } from "@/shared/utils/formatEventDate";
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
	const { event_id } = useParams<{ event_id: string }>();

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

	// Helper to update form values
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

	// Handle Name Change (auto-generate slug)
	function handleNameChange(value: string): void {
		setFormValue("event_name", value);
		if (!isEditing) {
			setFormValue("event_slug", generateSlug(value));
		}
	}

	// Handle Form Submission
	// oxlint-disable-next-line @typescript-eslint/no-deprecated -- narrow deprecation: React.FormEvent used intentionally for handler signature
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
					void navigate(`/events/${formValues.event_slug}`);
				}
			}),
		);
	}

	function handleDescriptionChange(value: string): void {
		setFormValue("event_description", value);
	}

	function handleDateChange(value: string): void {
		// Accept YYYY/MM/DD HH:mm format directly
		setFormValue("event_date", value);
	}

	function handleIsPublicChange(value: boolean): void {
		setFormValue("is_public", value);
	}

	function handlePlaylistSelect(playlistId: string): void {
		const idOrUndefined = playlistId === "" ? undefined : playlistId;
		setFormValue("active_playlist_id", idOrUndefined);
	}

	function setEventSlug(value: string): void {
		setFormValue("event_slug", value);
	}

	function setPublicNotes(value: string): void {
		setFormValue("public_notes", value);
	}

	function setPrivateNotes(value: string): void {
		setFormValue("private_notes", value);
	}

	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
	}

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
