import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/lib/form/useAppForm";
import useFormChanges from "@/react/lib/form/useFormChanges";
import generateSlug from "@/react/lib/slug/generateSlug";
import setFieldValue from "@/react/song/song-form/use-song-form/setFieldValue";
import useItemTags from "@/react/tag/useItemTags";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { eventViewPath } from "@/shared/paths";
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

	// Tag State
	tags: readonly string[];
	setTags: (tags: readonly string[]) => void;

	// Form State
	formValues: EventFormValues;
	setFormValue: (
		field: keyof EventFormValues,
		value: string | number | boolean | undefined,
	) => void;

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
	handleActiveSlidePositionSelect: (slidePosition: number) => void;
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
	const { event_id, lang } = useParams<{ event_id: string; lang: string }>();
	const { tags, getTags, setTags } = useItemTags("event", event_id);
	const langForNav = isSupportedLanguage(lang) ? lang : defaultLanguage;

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
	const currentEvent = useAppStore((state) => state.currentEvent);
	const fetchEventById = useAppStore((state) => state.fetchEventById);

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

	// Ensure edit routes can hydrate when opened directly by id.
	useEffect(() => {
		if (
			!isEditing ||
			event_id === undefined ||
			event_id === "" ||
			(currentEvent !== undefined &&
				currentEvent.event_id === event_id &&
				currentEvent.public !== undefined)
		) {
			return;
		}

		void (async (): Promise<void> => {
			try {
				await Effect.runPromise(fetchEventById(event_id));
			} catch (error: unknown) {
				console.error("[useEventForm] Failed to fetch event by id:", error);
			}
		})();
	}, [currentEvent, event_id, fetchEventById, isEditing]);

	// Controlled form field values
	const [formValues, setFormValuesState] = useState<EventFormValues>(() =>
		getDefaultEventFormValues(event_id),
	);

	// Helper to update form values
	/**
	 * Update a single form field value and sync it to the form element when present.
	 *
	 * @param field - field name to update
	 * @param value - new value for the field
	 * @returns void
	 */
	function setFormValue(
		field: keyof EventFormValues,
		value: string | number | boolean | undefined,
	): void {
		setFormValuesState((prev: EventFormValues) => ({ ...prev, [field]: value }));
		if (formRef.current && typeof value === "string") {
			setFieldValue(formRef.current, field, value);
		}
	}

	useSyncActiveSongSelection({
		formValues,
		setFormValuesState,
	});

	// Hydrates edit-mode form fields from the persisted current event snapshot.
	useEffect(() => {
		if (
			!isEditing ||
			currentEvent === undefined ||
			currentEvent.event_id !== event_id ||
			currentEvent.public === undefined
		) {
			return;
		}

		setFormValuesState({
			event_id,
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
	}, [currentEvent, event_id, isEditing, tags]);

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

	/**
	 * Run the saveEvent effect and return the resulting event id.
	 *
	 * @param request - payload to send to the save endpoint
	 * @returns Promise resolving to the saved event id
	 */
	function runSaveEvent(request: SaveEventRequest): Promise<string> {
		return Effect.runPromise(saveEvent(request));
	}

	const handleFormSubmit = createHandleFormSubmit({
		formValues,
		isEditing,
		getTags,
		runValidatedSubmit: (onSubmitValid: () => Promise<void>): Promise<void> =>
			Effect.runPromise(handleSubmit(formValues, onSubmitValid)),
		runSaveEvent,
		clearInitialState,
		navigateToEvent: (slug: string): void => {
			void navigate(buildPathWithLang(`/${eventViewPath}/${slug}`, langForNav));
		},
	});

	// Handle Name Change (auto-generate slug)
	/**
	 * Update the event name and auto-generate a slug when creating a new event.
	 *
	 * @param value - new event name
	 * @returns void
	 */
	function handleNameChange(value: string): void {
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
		// Accept YYYY/MM/DD HH:mm format directly
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
	 * Cancel editing and navigate back in history.
	 *
	 * @returns void
	 */
	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
	}
	/**
	 * Reset the form values to defaults and clear unsaved-change tracking.
	 *
	 * @returns void
	 */
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
		tags,
		setTags,
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
		handleActiveSlidePositionSelect,
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
