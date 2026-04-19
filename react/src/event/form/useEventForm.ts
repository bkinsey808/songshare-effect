import { Effect } from "effect";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import useAppForm from "@/react/lib/form/useAppForm";
import useItemTags from "@/react/tag/useItemTags";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { eventViewPath } from "@/shared/paths";
import { type ValidationError } from "@/shared/validation/validate-types";

import type {
	EventFormValues,
	EventFormValuesFromSchema,
	SaveEventRequest,
} from "../event-types";
import createHandleFormSubmit from "./createHandleFormSubmit";
import eventFormSchema from "./eventFormSchema";
import getEventSubmitLabel from "./getEventSubmitLabel";
import useEventFormState from "./use-event-form-state/useEventFormState";
import useEventFormStoreSelectors from "./useEventFormStoreSelectors";
import useFetchEventData from "./useFetchEventData";

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
	const {
		storeIsLoading,
		isSaving,
		storeError,
		setEventError,
		fetchPlaylistLibrary,
		playlistLibraryEntries,
		isPlaylistLibraryLoading,
		saveEvent,
		currentEvent,
		fetchEventById,
	} = useEventFormStoreSelectors();

	const isEditing = event_id !== undefined && event_id !== "";
	const hasNoPlaylists = Object.keys(playlistLibraryEntries).length === PLAYLISTS_NONE;

	// Composite hook for form state, change tracking, and synchronization
	const {
		formValues,
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
		resetForm,
		hasUnsavedChanges,
		initialValues,
		clearInitialState,
	} = useEventFormState({
		formRef,
		eventId: event_id,
		tags,
		isEditing,
		currentEvent,
	});

	useFetchEventData({
		eventId: event_id,
		isEditing,
		currentEvent,
		fetchPlaylistLibrary,
		fetchEventById,
		setEventError,
	});

	const { getFieldError, handleSubmit, isSubmitting } = useAppForm<EventFormValuesFromSchema>({
		schema: eventFormSchema,
		formRef,
		initialValues,
	});

	const handleFormSubmit = createHandleFormSubmit({
		formValues,
		isEditing,
		getTags,
		runValidatedSubmit: (onSubmitValid: () => Promise<void>): Promise<void> =>
			Effect.runPromise(handleSubmit(formValues, onSubmitValid)),
		runSaveEvent: (request: SaveEventRequest): Promise<string> =>
			Effect.runPromise(saveEvent(request)),
		clearInitialState,
		navigateToEvent: (slug: string): void => {
			void navigate(buildPathWithLang(`/${eventViewPath}/${slug}`, langForNav));
		},
	});

	/**
	 * Cancel editing and navigate back in history.
	 *
	 * @returns void
	 */
	function handleCancel(): void {
		void navigate(NAVIGATE_BACK);
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
		hasUnsavedChanges,
		isSaving: isSubmitting || isSaving || storeIsLoading,
		isPlaylistLibraryLoading,
		hasNoPlaylists,
		getFieldError,
		isSubmitting,
	};
}
