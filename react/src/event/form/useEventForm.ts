import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/form/useAppForm";
import useFormChanges from "@/react/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";
import { type ValidationError } from "@/shared/validation/validate-types";

import type { EventFormValues, EventFormValuesFromSchema, SaveEventRequest } from "../event-types";

import createHandleFormSubmit from "./createHandleFormSubmit";
import eventFormSchema from "./eventFormSchema";
import getDefaultEventFormValues from "./getDefaultEventFormValues";
import getEventSubmitLabel from "./getEventSubmitLabel";
import useSyncActiveSongSelection from "./useSyncActiveSongSelection";

const NAVIGATE_BACK = -1;
const PLAYLISTS_NONE = 0;

export type UseEventFormReturn = {
	getFieldError: (field: keyof EventFormValues) => ValidationError | undefined;
	isSubmitting: boolean;

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
	handleActiveSongSelect: (songId: string) => void;
	handleActiveSlideSelect: (slideId: string) => void;
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
	isPlaylistLibraryLoading: boolean;
	hasNoPlaylists: boolean;
};

/**
 * Manages event form state and behavior in the edit/create flow.
 *
 * @returns Event form state, handlers, and UI helpers
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
	const setEventError = useAppStore((state) => state.setEventError);
	const fetchPlaylistLibrary = useAppStore((state) => state.fetchPlaylistLibrary);
	const playlistLibraryEntries = useAppStore((state) => state.playlistLibraryEntries);
	const isPlaylistLibraryLoading = useAppStore((state) => state.isPlaylistLibraryLoading);
	const saveEvent = useAppStore((state) => state.saveEvent);

	const isEditing = event_id !== undefined && event_id !== "";
	const hasNoPlaylists = Object.keys(playlistLibraryEntries).length === PLAYLISTS_NONE;

	// Clears stale event errors when opening the create form.
	useEffect(() => {
		if (!isEditing) {
			setEventError(undefined);
		}
	}, [isEditing, setEventError]);

	// Loads playlist library entries so the active playlist selector has options.
	useEffect(() => {
		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchPlaylistLibrary());
			} catch (error: unknown) {
				console.error("[useEventForm] Failed to fetch playlist library:", error);
			}
		})();
	}, [fetchPlaylistLibrary]);

	// Controlled form field values
	const [formValues, setFormValuesState] = useState<EventFormValues>(() =>
		getDefaultEventFormValues(event_id),
	);

	// Helper to update form values
	function setFormValue(field: keyof EventFormValues, value: string | boolean | undefined): void {
		setFormValuesState((prev) => ({ ...prev, [field]: value }));
		if (formRef.current && typeof value === "string") {
			setFieldValue(formRef.current, field, value);
		}
	}

	useSyncActiveSongSelection({
		formValues,
		setFormValuesState,
	});

	// Form Changes Tracking
	const { hasUnsavedChanges: hasUnsavedChangesFn, clearInitialState } =
		useFormChanges<EventFormValues>({
			currentState: formValues,
			enabled: true,
		});

	// Initial Values for Validation
	const initialValues: Partial<EventFormValuesFromSchema> = getDefaultEventFormValues(event_id);

	const { getFieldError, handleSubmit, isSubmitting } = useAppForm<EventFormValuesFromSchema>({
		schema: eventFormSchema,
		formRef,
		initialValues,
	});

	function runSaveEvent(request: SaveEventRequest): Promise<string> {
		return Effect.runPromise(saveEvent(request));
	}

	const handleFormSubmit = createHandleFormSubmit({
		formValues,
		isEditing,
		runValidatedSubmit: (onSubmitValid: () => Promise<void>): Promise<void> =>
			Effect.runPromise(handleSubmit(formValues, onSubmitValid)),
		runSaveEvent,
		clearInitialState,
		navigateToEvent: (slug: string): void => {
			void navigate(`/events/${slug}`);
		},
	});

	// Handle Name Change (auto-generate slug)
	function handleNameChange(value: string): void {
		setFormValue("event_name", value);
		if (!isEditing) {
			setFormValue("event_slug", generateSlug(value));
		}
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
		if (formValues.active_playlist_id !== idOrUndefined) {
			setFormValue("active_song_id", undefined);
			setFormValue("active_slide_id", undefined);
		}
		setFormValue("active_playlist_id", idOrUndefined);
	}

	function handleActiveSongSelect(songId: string): void {
		const idOrUndefined = songId === "" ? undefined : songId;
		if (formValues.active_song_id !== idOrUndefined) {
			setFormValue("active_slide_id", undefined);
		}
		setFormValue("active_song_id", idOrUndefined);
	}

	function handleActiveSlideSelect(slideId: string): void {
		const idOrUndefined = slideId === "" ? undefined : slideId;
		setFormValue("active_slide_id", idOrUndefined);
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
		setFormValuesState(getDefaultEventFormValues(event_id));
		clearInitialState();
	}

	const submitLabel = getEventSubmitLabel({
		isSaving,
		isSubmitting,
		isEditing,
		t,
	});

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
		handleActiveSongSelect,
		handleActiveSlideSelect,
		setEventSlug,
		setPublicNotes,
		setPrivateNotes,
		handleCancel,
		isEditing,
		submitLabel,
		error: storeError,
		hasUnsavedChanges: hasUnsavedChangesFn(),
		isSaving: isSubmitting || isSaving || storeIsLoading,
		isPlaylistLibraryLoading,
		hasNoPlaylists,
		getFieldError,
		isSubmitting,
	};
}
