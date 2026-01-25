// src/features/song-form/useSongForm.ts
import { type Effect, Schema } from "effect";
import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import useAppForm from "@/react/form/useAppForm";
import useFormChanges from "@/react/form/useFormChanges";
import { useAppStore } from "@/react/zustand/useAppStore";

import { type SongPublic, songPublicSchema } from "../../song-schema";
import {
	type FormState,
	type Slide,
	type SongFormValues,
	type UseSongFormReturn,
} from "../song-form-types";
import { type SongFormValuesFromSchema as SongFormData, songFormSchema } from "../songSchema";
import generateSlug from "./generate/generateSlug";
import setFieldValue from "./setFieldValue";
import createFormSubmitHandler from "./submit/createFormSubmitHandler";
import deleteSongRequest from "./submit/deleteSongRequest";
import useFormSubmission from "./submit/useFormSubmission";
import useCollapsibleSections from "./useCollapsibleSections";
import useFetchSongData from "./useFetchSongData";
import useFormState from "./useFormState";
import useInitialFormState from "./useInitialFormState";
import usePopulateSongForm from "./usePopulateSongForm";

const NAVIGATE_BACK = -1;

export default function useSongForm(): UseSongFormReturn {
	const songId = useParams<{ song_id?: string }>().song_id;
	const location = useLocation();
	const navigate = useNavigate();
	const formRef = useRef<HTMLFormElement | null>(null);

	// Form field refs
	const songNameRef = useRef<HTMLInputElement | null>(null);
	const songSlugRef = useRef<HTMLInputElement | null>(null);

	// Track if form has been populated to avoid re-populating
	const hasPopulatedRef = useRef(false);
	// Track if we're currently fetching fresh data
	const isFetchingRef = useRef<boolean>(false);

	// Loading state - true when editing and waiting for fresh data
	// Initialize to true if we're editing (songId exists) to prevent flash of stale data
	const isEditing = songId !== undefined && songId.trim() !== "";
	const [isLoadingData, setIsLoadingData] = useState(isEditing);

	// Controlled form field values
	const [formValues, setFormValuesState] = useState<SongFormValues>({
		song_name: "",
		song_slug: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
	});

	// Helper to update form values
	function setFormValue(field: keyof typeof formValues, value: string): void {
		setFormValuesState((prev) => ({ ...prev, [field]: value }));
		// React will update the DOM automatically via the value prop
		// But we also update the DOM element for form submission compatibility
		// (FormData reads from DOM, not React state)
		if (formRef.current) {
			setFieldValue(formRef.current, field, value);
		}
	}

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
		fields,
		setSlideOrder,
		setSlides,
		toggleField,
		resetFormState,
		initialSlideId,
	} = useFormState();

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
		fields,
		slideOrder,
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
		short_credit: "",
		long_credit: "",
		private_notes: "",
		public_notes: "",
		fields: ["lyrics"],
		slide_order: [initialSlideId],
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
		hasUnsavedChanges,
		onSaveSuccess: (data: unknown) => {
			const decoded = Schema.decodeUnknownEither(songPublicSchema)(data);
			if (decoded._tag === "Right") {
				const song: SongPublic = decoded.right;
				addOrUpdatePublicSongs({ [song.song_id]: song });
				// On create, add to library slice so it appears in "My library" and persists to localStorage
				const wasCreate = songId === undefined || songId.trim() === "";
				if (
					wasCreate &&
					currentUserId !== undefined &&
					currentUserId !== ""
				) {
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
		isFetchingRef,
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
		isFetchingRef,
		hasPopulatedRef,
		formRef,
		songNameRef,
		songSlugRef,
		fields,
		setIsLoadingData,
		setFormValuesState,
		setSlideOrder,
		setSlides,
		toggleField,
		initialSlideId,
	});

	useInitialFormState({
		songId,
		formValues,
		fields,
		slideOrder,
		slides,
		isLoadingData,
		hasPopulatedRef,
		setInitialState: setInitialFormState,
	});

	// Handle form submission with data collection
	const handleFormSubmit = createFormSubmitHandler<SongFormData>({
		songId,
		fields,
		slideOrder,
		slides,
		handleSubmit,
		onSubmit,
	});

	// Update internal state when form data changes
	function updateSlideOrder(newOrder: readonly string[]): void {
		setSlideOrder(newOrder);
	}

	function updateSlides(newSlides: Readonly<Record<string, Slide>>): void {
		setSlides(newSlides);
	}

	// Handle song name blur to generate slug
	function handleSongNameBlur(): void {
		const name = formValues.song_name.trim();
		const currentSlug = formValues.song_slug.trim();
		if (name !== "" && currentSlug === "") {
			const generatedSlug = generateSlug(name);
			setFormValue("song_slug", generatedSlug);
		}
	}

	// Handle save button click
	function handleSave(): void {
		// handleFormSubmit handles null form element internally
		// Promise is voided since we don't need to wait for completion
		void handleFormSubmit(formRef.current);
	}

	// Wrapper for resetForm that also resets form values
	function resetForm(): void {
		resetFormState();
		const emptyFormValues = {
			song_name: "",
			song_slug: "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		};
		setFormValuesState(emptyFormValues);
		hasPopulatedRef.current = false;
		// Reset initial state after reset
		setInitialFormState({
			formValues: emptyFormValues,
			fields: ["lyrics"],
			slideOrder: [initialSlideId],
			slides: {
				[initialSlideId]: {
					slide_name: "Slide 1",
					field_data: {},
				},
			},
		});
	}

	async function handleDelete(): Promise<void> {
		const id = songId?.trim();
		if (id === undefined || id === "") {
			return;
		}
		const result = await deleteSongRequest(id);
		if (result.success) {
			removeActivePrivateSongIds([id]);
			removeActivePublicSongIds([id]);
			removeSongsFromCache([id]);
			removeSongLibraryEntry(id);
			void navigate(NAVIGATE_BACK);
		} else {
			console.error("[useSongForm] Delete failed:", result.errorMessage);
		}
	}

	return {
		getFieldError,
		isSubmitting,
		isLoadingData,
		slideOrder,
		slides,
		fields,
		setSlideOrder: updateSlideOrder,
		setSlides: updateSlides,
		toggleField,
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
		hasUnsavedChanges,
	};
}
