// src/features/song-form/useSongForm.ts
import { Effect } from "effect";
import { useRef } from "react";
import { useParams } from "react-router-dom";

import useAppForm from "@/react/form/useAppForm";
import { safeSet } from "@/shared/utils/safe";

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

export default function useSongForm(): UseSongFormReturn {
	const songId = useParams<{ song_id?: string }>().song_id;
	const formRef = useRef<HTMLFormElement | null>(null);

	// Form field refs
	const songNameRef = useRef<HTMLInputElement | null>(null);
	const songSlugRef = useRef<HTMLInputElement | null>(null);

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
		const name = songNameRef.current?.value?.trim();
		const currentSlug = songSlugRef.current?.value?.trim();
		if (
			typeof name === "string" &&
			name !== "" &&
			(typeof currentSlug !== "string" || currentSlug === "")
		) {
			const generatedSlug = generateSlug(name ?? "");
			if (songSlugRef.current) {
				songSlugRef.current.value = generatedSlug;
			}
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

	return {
		getFieldError,
		isSubmitting,
		slideOrder,
		slides,
		fields,
		setSlideOrder: updateSlideOrder,
		setSlides: updateSlides,
		toggleField,
		handleFormSubmit,
		formRef,
		resetForm: resetFormState,

		// Form field refs
		songNameRef,
		songSlugRef,

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
