import { Schema } from "effect";
import { useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import useAppForm from "@/react/lib/form/useAppForm";
import { type SongPublic, songPublicSchema } from "@/react/song/song-schema";
import useItemTags from "@/react/tag/useItemTags";

import { type UseSongFormReturn } from "../song-form-types";
import { type SongFormValuesFromSchema as SongFormData, songFormSchema } from "../songSchema";
import createFormSubmitHandler from "./submit/createFormSubmitHandler";
import useFormSubmission from "./submit/useFormSubmission";
import useSongFormState from "./use-song-form-state/useSongFormState";
import useChordPickerRequest from "./useChordPickerRequest";
import useCollapsibleSections from "./useCollapsibleSections";
import useFetchSongData from "./useFetchSongData";
import useFormStoreSelectors from "./useFormStoreSelectors";
import usePopulateSongForm from "./usePopulateSongForm";
import useSongFormDelete from "./useSongFormDelete";

/**
 * High-level hook that composes all song form logic: state, validation,
 * data fetching, submission handlers, and collapsible UI state.
 *
 * @returns An object exposing form state, refs, handlers, and helpers used by the Song form UI
 */
export default function useSongForm(): UseSongFormReturn {
	const songId = useParams<{ song_id?: string }>().song_id;
	const { tags, getTags, setTags } = useItemTags("song", songId);
	const location = useLocation();
	const formRef = useRef<HTMLFormElement | null>(null);

	// Form field refs
	const songNameRef = useRef<HTMLInputElement | null>(null);
	const songSlugRef = useRef<HTMLInputElement | null>(null);

	// Track if form has been populated to avoid re-populating
	const hasPopulatedRef = useRef(false);
	// Track if we're currently fetching fresh data (state so changes trigger re-renders)
	const [isFetching, setIsFetching] = useState(false);
	const [submitError, setSubmitError] = useState<string | undefined>(undefined);

	// Loading state - true when editing and waiting for fresh data
	// Initialize to true if we're editing (songId exists) to prevent flash of stale data
	const isEditing = songId !== undefined && songId.trim() !== "";
	const [isLoadingData, setIsLoadingData] = useState(isEditing);

	// Composite hook for form state, change tracking, and initial values
	const {
		formValues,
		setFormValuesState,
		setFormValue,
		handleSongNameBlur,
		fields,
		hasUnsavedChanges,
		clearInitialState,
		initialValues,
		resetForm,
		updateSlideOrder,
		updateSlides,
		slideOrder,
		slides,
		resetFormState,
		initialSlideId,
		setSlideOrder,
		setSlides,
	} = useSongFormState({
		formRef,
		songId,
		isLoadingData,
		tags,
		hasPopulatedRef,
	});

	const {
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,
	} = useCollapsibleSections();

	// Get store methods for fetching song data
	const {
		addActivePrivateSongIds,
		addActivePublicSongIds,
		addOrUpdatePublicSongs,
		removeActivePrivateSongIds,
		removeActivePublicSongIds,
		removeSongsFromCache,
		removeSongLibraryEntry,
		addSongLibraryEntry,
		privateSongs,
		publicSongs,
		currentUserId,
	} = useFormStoreSelectors();

	const { getFieldError, handleSubmit, isSubmitting, handleApiResponseEffect } =
		useAppForm<SongFormData>({
			schema: songFormSchema,
			formRef,
			initialValues,
		});

	const { onSubmit, handleCancel } = useFormSubmission({
		handleApiResponseEffect,
		resetFormState,
		setSubmitError: (message) => {
			setSubmitError(message);
		},
		clearSubmitError: () => {
			setSubmitError(undefined);
		},
		onSaveSuccess: (data: unknown) => {
			const decoded = Schema.decodeUnknownEither(songPublicSchema)(data);
			if (decoded._tag === "Right") {
				const song: SongPublic = decoded.right;
				addOrUpdatePublicSongs({ [song.song_id]: song });
				// On create, add to library slice so it appears in "My library" and persists to localStorage
				const wasCreate = songId === undefined || songId.trim() === "";
				if (wasCreate && currentUserId !== undefined && currentUserId !== "") {
					addSongLibraryEntry({
						song_id: song.song_id,
						user_id: currentUserId,
						song_owner_id: currentUserId,
						created_at: new Date().toISOString(),
						song_name: song.song_name,
						song_slug: song.song_slug,
					});
				}
			}
		},
	});

	useFetchSongData({
		songId,
		location,
		addActivePrivateSongIds,
		addActivePublicSongIds,
		setIsFetching,
		hasPopulatedRef,
		setIsLoadingData,
		setFormValuesState,
		clearInitialState,
	});

	usePopulateSongForm({
		songId,
		publicSongs,
		privateSongs,
		currentUserId,
		isFetching,
		hasPopulatedRef,
		formRef,
		songNameRef,
		songSlugRef,
		setIsLoadingData,
		setFormValuesState,
		setSlideOrder,
		setSlides,
		initialSlideId,
	});

	// Handle form submission with data collection
	const handleFormSubmit = createFormSubmitHandler<SongFormData>({
		songId,
		lyrics: formValues.lyrics,
		script: formValues.script,
		translations: formValues.translations,
		slideOrder,
		slides,
		getTags,
		handleSubmit,
		onSubmit,
	});

	// Handle save button click
	/**
	 * Trigger form submission via the form submit handler.
	 *
	 * @returns void
	 */
	function handleSave(): void {
		// handleFormSubmit handles null form element internally
		// Promise is voided since we don't need to wait for completion
		void handleFormSubmit(formRef.current);
	}

	const { handleDelete: handleDeleteSong } = useSongFormDelete({
		songId,
		removeActivePrivateSongIds,
		removeActivePublicSongIds,
		removeSongsFromCache,
		removeSongLibraryEntry,
	});

	const hasChanges = isLoadingData ? false : hasUnsavedChanges();

	const { pendingChordPickerRequest, openChordPicker, closeChordPicker, insertChordFromPicker } =
		useChordPickerRequest();

	return {
		getFieldError,
		isSubmitting,
		isLoadingData,
		submitError,
		slideOrder,
		slides,
		fields,
		setSlideOrder: updateSlideOrder,
		setSlides: updateSlides,
		handleFormSubmit,
		formRef,
		resetForm,

		// Form field refs
		songNameRef,
		songSlugRef,

		// Controlled form field values
		formValues,
		setFormValue,

		// Collapsible section state
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,

		// Handlers
		handleSongNameBlur,
		handleSave,
		handleCancel,
		handleDelete: handleDeleteSong,
		hasChanges,

		// Tag state
		tags,
		setTags,

		// Editing state
		isEditing,

		// Chord picker state
		pendingChordPickerRequest,
		openChordPicker,
		closeChordPicker,
		insertChordFromPicker,
	};
}
