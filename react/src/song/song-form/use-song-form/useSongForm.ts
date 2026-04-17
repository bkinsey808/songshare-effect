import { Effect, Schema } from "effect";
import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import useAppStore from "@/react/app-store/useAppStore";
import useAppForm from "@/react/lib/form/useAppForm";
import useFormChanges from "@/react/lib/form/useFormChanges";
import { type SongPublic, songPublicSchema } from "@/react/song/song-schema";
import useItemTags from "@/react/tag/useItemTags";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";
import { defaultLanguage } from "@/shared/language/supported-languages";

import { type FormState, type Slide, type UseSongFormReturn } from "../song-form-types";
import { type SongFormValuesFromSchema as SongFormData, songFormSchema } from "../songSchema";
import createFormSubmitHandler from "./submit/createFormSubmitHandler";
import deleteSongEffect from "./submit/deleteSongRequest";
import useFormSubmission from "./submit/useFormSubmission";
import useChordPickerRequest from "./useChordPickerRequest";
import useCollapsibleSections from "./useCollapsibleSections";
import useFetchSongData from "./useFetchSongData";
import useFormState from "./useFormState";
import useInitialFormState from "./useInitialFormState";
import usePopulateSongForm from "./usePopulateSongForm";
import useSongFormValues from "./useSongFormValues";

const NAVIGATE_BACK = -1;

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
	const navigate = useNavigate();
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

	const { formValues, setFormValuesState, setFormValue, handleSongNameBlur, resetFormValues } =
		useSongFormValues({ formRef });

	// Get store methods for fetching song data
	const addActivePrivateSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error> =
		useAppStore((state) => state.addActivePrivateSongIds);
	const addActivePublicSongIds: (songIds: readonly string[]) => Effect.Effect<void, Error> =
		useAppStore((state) => state.addActivePublicSongIds);
	const addOrUpdatePublicSongs = useAppStore((state) => state.addOrUpdatePublicSongs);
	const removeActivePrivateSongIds = useAppStore((state) => state.removeActivePrivateSongIds);
	const removeActivePublicSongIds = useAppStore((state) => state.removeActivePublicSongIds);
	const removeSongsFromCache = useAppStore((state) => state.removeSongsFromCache);
	const removeSongLibraryEntry = useAppStore((state) => state.removeSongLibraryEntry);
	const addSongLibraryEntry = useAppStore((state) => state.addSongLibraryEntry);
	const privateSongs = useAppStore((state) => state.privateSongs);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	// Use extracted hooks
	const {
		slideOrder,
		slides,
		setSlideOrder,
		setSlides,
		resetFormState,
		initialSlideId,
	} = useFormState();

	// Derive active display fields from language pickers in formValues
	const fields: readonly string[] = [
		formValues.lyrics,
		...(formValues.script === undefined ? [] : [formValues.script]),
		...formValues.translations,
	];

	const {
		isFormFieldsExpanded,
		setIsFormFieldsExpanded,
		isSlidesExpanded,
		setIsSlidesExpanded,
		isGridExpanded,
		setIsGridExpanded,
	} = useCollapsibleSections();

	// Combine all form state for change tracking
	const currentFormState: FormState = {
		formValues,
		slideOrder,
		tags,
		slides,
	};

	// Use generic form changes hook - default deep equality comparison handles nested state
	const {
		hasUnsavedChanges,
		setInitialState: setInitialFormState,
		clearInitialState,
	} = useFormChanges<FormState>({
		currentState: currentFormState,
		enabled: !isLoadingData,
	});

	const initialValues: Partial<SongFormData> = {
		song_id: songId,
		song_name: "",
		song_slug: "",
		lyrics: defaultLanguage,
		script: undefined,
		translations: [],
		short_credit: "",
		long_credit: "",
		private_notes: "",
		public_notes: "",
		slide_order: [initialSlideId],
		tags: [],
		slides: {
			[initialSlideId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		},
	};

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

	useInitialFormState({
		songId,
		formValues,
		slideOrder,
		tags,
		slides,
		isLoadingData,
		hasPopulatedRef,
		setInitialState: setInitialFormState,
	});

	// Handle form submission with data collection
	const handleFormSubmit = createFormSubmitHandler<SongFormData>({
		songId,
		translations: formValues.translations,
		slideOrder,
		slides,
		getTags,
		handleSubmit,
		onSubmit,
	});

	// Update internal state when form data changes
	/**
	 * Replace the current slide order with `newOrder`.
	 *
	 * @param newOrder - New ordered array of slide ids
	 * @returns void
	 */
	function updateSlideOrder(newOrder: readonly string[]): void {
		setSlideOrder(newOrder);
	}

	/**
	 * Replace the slides map with `newSlides`.
	 *
	 * @param newSlides - New slides map keyed by id
	 * @returns void
	 */
	function updateSlides(newSlides: Readonly<Record<string, Slide>>): void {
		setSlides(newSlides);
	}

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

	// Wrapper for resetForm that also resets form values
	/**
	 * Reset the form state and controlled values to their defaults.
	 *
	 * @returns void
	 */
	function resetForm(): void {
		const newFirstId = resetFormState();
		const emptyFormValues = resetFormValues();
		hasPopulatedRef.current = false;
		// Sync initial state with the new reset state so hasUnsavedChanges clears
		setInitialFormState({
			formValues: emptyFormValues,
			slideOrder: [newFirstId],
			tags: [],
			slides: {
				[newFirstId]: {
					slide_name: "Slide 1",
					field_data: {},
				},
			},
		});
	}

	/**
	 * Delete the current song by id and clean up local store caches.
	 *
	 * @returns Promise<void>
	 */
	async function handleDelete(): Promise<void> {
		const id = songId?.trim();
		if (id === undefined || id === "") {
			return;
		}
		try {
			await Effect.runPromise(deleteSongEffect(id));
			removeActivePrivateSongIds([id]);
			removeActivePublicSongIds([id]);
			removeSongsFromCache([id]);
			removeSongLibraryEntry(id);
			void navigate(NAVIGATE_BACK);
		} catch (error) {
			console.error(
				"[useSongForm] Delete failed:",
				extractErrorMessage(error, "Failed to delete song"),
			);
		}
	}

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
		handleDelete,
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
