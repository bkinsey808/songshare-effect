// src/features/song-form/useSongForm.ts
import { Effect } from "effect";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import useAppForm from "@/react/form/useAppForm";
import { useAppStore } from "@/react/zustand/useAppStore";
import buildPathWithLang from "@/shared/language/buildPathWithLang";
import { defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { dashboardPath } from "@/shared/paths";
import { SIGNAL_ONE } from "@/shared/constants/http";
import { justUnauthorizedAccessKey } from "@/shared/sessionStorageKeys";
import { safeGet, safeSet } from "@/shared/utils/safe";
import { isRecord, isString } from "@/shared/utils/typeGuards";

// Helpers extracted to separate files
import computeFieldsArray from "./helpers/computeFieldsArray";
import computeSlideOrder from "./helpers/computeSlideOrder";
import computeSlides from "./helpers/computeSlides";
import DOM_READY_TIMEOUT_MS from "./helpers/constants";
import setFieldValue from "./helpers/setFieldValue";
import { songFormSchema, type SongFormValuesFromSchema as SongFormData } from "./songSchema";
import { type Slide } from "./songTypes";
import toStringArray from "./toStringArray";
import useCollapsibleSections from "./useCollapsibleSections";
import useFormState from "./useFormState";
import useFormSubmission from "./useFormSubmission";
import generateSlug from "./utils/generateSlug";

// Use the concrete type derived from the schema

type GetFieldError = (
	field: keyof SongFormData,
) => { field: string; message: string; params?: Record<string, unknown> } | undefined;

type UseSongFormReturn = {
	getFieldError: GetFieldError;
	isSubmitting: boolean;
	isLoadingData: boolean;
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
	fields: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	toggleField: (field: string, checked: boolean) => void;

	handleFormSubmit: (event: Event | React.FormEvent) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
	resetForm: () => void;

	// Form field refs
	songNameRef: React.RefObject<HTMLInputElement | null>;
	songSlugRef: React.RefObject<HTMLInputElement | null>;

	// Controlled form field values
	formValues: {
		song_name: string;
		song_slug: string;
		short_credit: string;
		long_credit: string;
		public_notes: string;
		private_notes: string;
	};
	setFormValue: (field: keyof UseSongFormReturn["formValues"], value: string) => void;

	// Collapsible section state
	isFormFieldsExpanded: boolean;
	setIsFormFieldsExpanded: (expanded: boolean) => void;
	isSlidesExpanded: boolean;
	setIsSlidesExpanded: (expanded: boolean) => void;
	isGridExpanded: boolean;
	setIsGridExpanded: (expanded: boolean) => void;

	// Handlers
	handleSongNameBlur: () => void;
	handleSave: () => Promise<void>;
	handleCancel: () => void;
};

/* eslint-disable max-lines-per-function */
export default function useSongForm(): UseSongFormReturn {
	const songId = useParams<{ song_id?: string }>().song_id;
	const location = useLocation();
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
	const [formValues, setFormValuesState] = useState({
		song_name: "",
		song_slug: "",
		short_credit: "",
		long_credit: "",
		public_notes: "",
		private_notes: "",
	});

	// Helper to update form values
	function setFormValue(
		field: keyof typeof formValues,
		value: string,
	): void {
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
	const privateSongs = useAppStore((state) => state.privateSongs);
	const publicSongs = useAppStore((state) => state.publicSongs);
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);
	const navigate = useNavigate();

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
	});

	// Fetch and populate song data when editing
	// Reset populated flag when songId or location changes (navigating to/back to form)
	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			hasPopulatedRef.current = false;
			isFetchingRef.current = false;
			setIsLoadingData(false);
			// Reset form values when not editing
			setFormValuesState({
				song_name: "",
				song_slug: "",
				short_credit: "",
				long_credit: "",
				public_notes: "",
				private_notes: "",
			});
			return;
		}

		// Reset populated flag when songId or location changes (forces refresh when navigating back)
		hasPopulatedRef.current = false;
		
		// Clear form values to prevent flash of stale data
		setFormValuesState({
			song_name: "",
			song_slug: "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		});
		
		setIsLoadingData(true); // Show loading spinner while fetching fresh data

		// Fetch both private and public song data (this will refresh from database)
		// Run both Effects sequentially using Effect.all
		isFetchingRef.current = true;
		
		Effect.runFork(
			Effect.all([
				addActivePrivateSongIds([songId]),
				addActivePublicSongIds([songId]),
			], { concurrency: "unbounded" }).pipe(
				Effect.asVoid,
				Effect.tap(() =>
					Effect.sync(() => {
						isFetchingRef.current = false;
					}),
				),
				Effect.catchAll((error) => {
					console.error("[useSongForm] Error fetching song data:", error);
					return Effect.sync(() => {
						isFetchingRef.current = false;
						setIsLoadingData(false);
					});
				}),
			),
		);
	}, [songId, location.pathname, addActivePrivateSongIds, addActivePublicSongIds]);

	// Check ownership and populate form when song data is available
	// This effect is reactive to changes in publicSongs and privateSongs
	useEffect(() => {
		if (songId === undefined || songId.trim() === "") {
			// If not editing, ensure loading is false
			setIsLoadingData(false);
			return;
		}

		// Note: We don't check formRef.current here because the form might not be rendered yet
		// (it's hidden behind the spinner). We'll check it only when needed for DOM updates.

		const songPublic = safeGet(publicSongs, songId);
		const songPrivate = safeGet(privateSongs, songId);

		// Only populate if fetch has completed (or if we're not currently fetching)
		// This ensures we only use fresh data from the completed fetch
		if (isFetchingRef.current) {
			// Still fetching - wait for it to complete
			// The effect will re-run when the store updates after fetch completes
			return;
		}

		// Only require private song to be loaded (it's needed for private_notes)
		// Public song may fail to decode, but we can still populate what we can
		if (songPrivate === undefined) {
			// Data not ready yet, keep loading state true and wait
			// The effect will re-run when privateSongs updates
			// Set a fallback timeout to prevent spinner from being stuck forever
			const FALLBACK_TIMEOUT_MS = 5000;
			const fallbackTimeout = setTimeout((): void => {
				setIsLoadingData(false);
			}, FALLBACK_TIMEOUT_MS);
			return (): void => {
				clearTimeout(fallbackTimeout);
			};
		}

		// CRITICAL: Check ownership before allowing edit access
		// If the song's user_id doesn't match the current user, redirect to dashboard
		if (isRecord(songPublic) && currentUserId !== undefined) {
			const songUserId = songPublic.user_id;
			if (isString(songUserId) && songUserId !== currentUserId) {
				// User doesn't own this song - redirect to dashboard with alert
				try {
					sessionStorage.setItem(justUnauthorizedAccessKey, SIGNAL_ONE);
				} catch {
					// ignore storage errors
				}
				// Get current language from pathname for navigation
				const PATH_SEGMENT_INDEX = 1;
				const currentLang = typeof globalThis === "undefined"
					? defaultLanguage
					: new URL(globalThis.location.href).pathname.split("/")[PATH_SEGMENT_INDEX] ?? defaultLanguage;
				const langForNav = isSupportedLanguage(currentLang) ? currentLang : defaultLanguage;
				void navigate(buildPathWithLang(`/${dashboardPath}`, langForNav), { replace: true });
				return;
			}
		}

		// If we've already populated, we're done (subsequent updates handled by realtime subscriptions)
		if (hasPopulatedRef.current) {
			setIsLoadingData(false);
			return;
		}

		// First time populating after fetch - this is guaranteed to be fresh data
		// because fetchInitiatedRef was set BEFORE the fetch, so any data arriving
		// now must be from the fresh fetch
		hasPopulatedRef.current = true;

		// Update controlled form values immediately when data is available
		// Public song has song_name, song_slug, etc. Private song only has private_notes
		if (isRecord(songPublic)) {
			// Update form values state from public song data
			setFormValuesState({
				song_name: isString(songPublic.song_name) ? songPublic.song_name : "",
				song_slug: isString(songPublic.song_slug) ? songPublic.song_slug : "",
				short_credit: isString(songPublic.short_credit) ? songPublic.short_credit : "",
				long_credit: isString(songPublic.long_credit) ? songPublic.long_credit : "",
				public_notes: isString(songPublic.public_notes) ? songPublic.public_notes : "",
				private_notes: isRecord(songPrivate) && "private_notes" in songPrivate && isString(songPrivate.private_notes)
					? songPrivate.private_notes
					: "",
			});
		} else if (isRecord(songPrivate) && "private_notes" in songPrivate) {
			// If no public song, at least set private notes if available
			const privateNotes = songPrivate.private_notes;
			if (isString(privateNotes)) {
				setFormValuesState((prev) => ({
					...prev,
					private_notes: privateNotes,
				}));
			}
		}

		// Use requestAnimationFrame to ensure form is fully updated before showing
		// This prevents flash of partially populated form
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsLoadingData(false);
			});
		});

		// Also update DOM elements for form submission compatibility
		const timeoutId = setTimeout(() => {
			// Only public song has song_name, song_slug, etc.
			if (isRecord(songPublic) && formRef.current) {
				// Access song_name safely
				if ("song_name" in songPublic) {
					const songName = songPublic.song_name;
					if (isString(songName)) {
						setFieldValue(formRef.current, "song_name", songName);
						if (songNameRef.current) {
							songNameRef.current.value = songName;
						}
					}
				}

				// Access song_slug safely
				if ("song_slug" in songPublic) {
					const songSlug = songPublic.song_slug;
					if (isString(songSlug)) {
						setFieldValue(formRef.current, "song_slug", songSlug);
						if (songSlugRef.current) {
							songSlugRef.current.value = songSlug;
						}
					}
				}

				if ("short_credit" in songPublic) {
					const shortCredit = songPublic.short_credit;
					setFieldValue(
						formRef.current,
						"short_credit",
						isString(shortCredit) ? shortCredit : undefined,
					);
				}
				if ("long_credit" in songPublic) {
					const longCredit = songPublic.long_credit;
					setFieldValue(
						formRef.current,
						"long_credit",
						isString(longCredit) ? longCredit : undefined,
					);
				}
				if ("public_notes" in songPublic) {
					const publicNotes = songPublic.public_notes;
					setFieldValue(
						formRef.current,
						"public_notes",
						isString(publicNotes) ? publicNotes : undefined,
					);
				}
			}

			// Populate private_notes from songPrivate
			if (isRecord(songPrivate) && "private_notes" in songPrivate && formRef.current) {
				const privateNotes = songPrivate.private_notes;
				if (isString(privateNotes)) {
					const element = formRef.current.elements.namedItem("private_notes");
					if (element instanceof HTMLTextAreaElement) {
						element.value = privateNotes;
					}
				}
			}
		}, DOM_READY_TIMEOUT_MS);

		// Populate slides and fields from songPublic (only public song has this data)
		if (isRecord(songPublic)) {
			// Compute and apply fields
			const fieldsArray = computeFieldsArray(songPublic);
			const allPossibleFields = ["lyrics", "script", "enTranslation"];
			for (const field of allPossibleFields) {
				if (typeof field === "string") {
					const shouldBeEnabled = fieldsArray.includes(field);
					const isCurrentlyEnabled = fields.includes(field);
					if (shouldBeEnabled !== isCurrentlyEnabled) {
						toggleField(field, shouldBeEnabled);
					}
				}
			}

			// Slide order
			setSlideOrder(computeSlideOrder(songPublic));

			// Slides
			setSlides(computeSlides(songPublic));
		}
		
		// Note: isLoadingData is already set to false above after populating form values
		// This ensures the form only shows after all data (including slides) is populated

		function cleanup(): void {
			clearTimeout(timeoutId);
		}
		return cleanup;
	}, [songId, publicSongs, privateSongs, setSlideOrder, setSlides, toggleField, fields, currentUserId, navigate, setIsLoadingData]);

	// Handle form submission with data collection

	async function handleFormSubmit(event: Event | React.FormEvent): Promise<void> {
		event.preventDefault();

		// Read form data
		// Keep typing clean — use nullish coalescing instead of `|| undefined`.
		const formDataObj = new FormData(formRef.current ?? undefined);
		const currentFormData: Record<string, unknown> = {};
		for (const [key, value] of formDataObj.entries()) {
			if (typeof value === "string") {
				safeSet(currentFormData, key, value);
			} else if (value instanceof File) {
				safeSet(currentFormData, key, value.name);
			} else {
				safeSet(currentFormData, key, String(value));
			}
		}

		// Add controlled state values that aren't captured by FormData
		// Convert readonly arrays to mutable arrays expected by the schema
		// Map/convert each value to a string to avoid unsafe spread of unknown/any values
		// CRITICAL: Include song_id if editing (it's not in FormData but needed for updates)
		if (songId !== undefined && songId.trim() !== "") {
			currentFormData["song_id"] = songId;
		}
		currentFormData["fields"] = toStringArray(fields);
		currentFormData["slide_order"] = toStringArray(slideOrder);
		currentFormData["slides"] = slides;

		try {
			await Effect.runPromise(handleSubmit(currentFormData, onSubmit));
		} catch (error) {
			console.error("❌ handleSubmit failed:", error);
		}
	}

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
	async function handleSave(): Promise<void> {
		if (formRef.current) {
			// Create a synthetic form event
			// Narrow, localized assertion: synthetic DOM Event wrapped as React.FormEvent
			// Create a DOM Event and pass it directly — handleFormSubmit now
			// accepts either a DOM Event or a React.FormEvent so no unsafe cast
			// is required.
			const syntheticEvent = new Event("submit", {
				bubbles: true,
				cancelable: true,
			});
			await handleFormSubmit(syntheticEvent);
		}
	}

	// Wrapper for resetForm that also resets form values
	function resetForm(): void {
		resetFormState();
		setFormValuesState({
			song_name: "",
			song_slug: "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		});
		hasPopulatedRef.current = false;
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
	};
}
