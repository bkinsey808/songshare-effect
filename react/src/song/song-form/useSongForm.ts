// src/features/song-form/useSongForm.ts
import { Effect, type Schema } from "effect";
import { useRef } from "react";
import { useParams } from "react-router-dom";

import { useAppForm } from "@/react/form/useAppForm";
import { safeSet } from "@/shared/utils/safe";

import type { Slide } from "./songTypes";

import { songFormSchema } from "./songSchema";
import { useCollapsibleSections } from "./useCollapsibleSections";
import { useFormState } from "./useFormState";
import { useFormSubmission } from "./useFormSubmission";
import { generateSlug } from "./utils/generateSlug";

// Define the form values type manually since schema is unknown
type SongFormData = {
	song_id?: string | undefined;
	song_name: string;
	song_slug: string;
	short_credit?: string | undefined;
	long_credit?: string | undefined;
	private_notes?: string | undefined;
	public_notes?: string | undefined;
	fields: string[];
	slide_order: string[];
	slides: Record<string, Slide>;
};

type GetFieldError = (
	field: keyof SongFormData,
) =>
	| { field: string; message: string; params?: Record<string, unknown> }
	| undefined;

type UseSongFormReturn = {
	getFieldError: GetFieldError;
	isSubmitting: boolean;
	slideOrder: ReadonlyArray<string>;
	slides: Record<string, Slide>;
	fields: string[];
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	toggleField: (field: string, checked: boolean) => void;

	handleFormSubmit: (event: React.FormEvent) => Promise<void>;
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
	const formRef = useRef<HTMLFormElement>(null);

	// Form field refs
	const songNameRef = useRef<HTMLInputElement>(null);
	const songSlugRef = useRef<HTMLInputElement>(null);

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
		useAppForm({
			schema: songFormSchema as Schema.Schema<
				SongFormData,
				SongFormData,
				never
			>,
			formRef,
			initialValues,
		});

	const { onSubmit, handleCancel } = useFormSubmission({
		handleApiResponseEffect,
		resetFormState,
	});

	// Handle form submission with data collection

	const handleFormSubmit = async (event: React.FormEvent): Promise<void> => {
		event.preventDefault();

		// Read form data
		// Keep typing clean — use nullish coalescing instead of `|| undefined`.
		const formDataObj = new FormData(formRef.current ?? undefined);
		const currentFormData: Record<string, unknown> = {};
		for (const [key, value] of formDataObj.entries()) {
			safeSet(currentFormData, key, value.toString());
		}

		// Add controlled state values that aren't captured by FormData
		currentFormData["fields"] = fields;
		currentFormData["slide_order"] = slideOrder;
		currentFormData["slides"] = slides;

		try {
			await Effect.runPromise(handleSubmit(currentFormData, onSubmit));
		} catch (error) {
			console.error("❌ handleSubmit failed:", error);
		}
	};

	// Update internal state when form data changes
	const updateSlideOrder = (newOrder: ReadonlyArray<string>): void => {
		setSlideOrder(newOrder);
	};

	const updateSlides = (newSlides: Readonly<Record<string, Slide>>): void => {
		setSlides(newSlides);
	};

	// Handle song name blur to generate slug
	const handleSongNameBlur = (): void => {
		const name = songNameRef.current?.value?.trim();
		const currentSlug = songSlugRef.current?.value?.trim();
		if ((name?.length ?? 0) > 0 && (currentSlug?.length ?? 0) === 0) {
			const generatedSlug = generateSlug(name ?? "");
			if (songSlugRef.current) {
				songSlugRef.current.value = generatedSlug;
			}
		}
	};

	// Handle save button click
	const handleSave = async (): Promise<void> => {
		if (formRef.current) {
			// Create a synthetic form event
			const syntheticEvent = new Event("submit", {
				bubbles: true,
				cancelable: true,
			}) as unknown as React.FormEvent;
			await handleFormSubmit(syntheticEvent);
		}
	};

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
