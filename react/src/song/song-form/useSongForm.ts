// src/features/song-form/useSongForm.ts
import { Effect, type Schema } from "effect";
import { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { songFormSchema } from "./songSchema";
import { type Slide } from "./songTypes";
import { useAppForm } from "@/react/form/useAppForm";
import { safeSet } from "@/shared/utils/safe";

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

export default function useSongForm(): {
	handleFieldBlur: <K extends keyof SongFormData>(
		field: K,
		ref: React.RefObject<HTMLInputElement | null>,
	) => void;
	getFieldError: (
		field: keyof SongFormData,
	) =>
		| { field: string; message: string; params?: Record<string, unknown> }
		| undefined;
	handleSubmit: (
		formData: Record<string, unknown>,
		onSubmit: (data: SongFormData) => Promise<void> | void,
	) => Effect.Effect<void, never, never>;
	validationErrors: {
		field: string;
		message: string;
		params?: Record<string, unknown>;
	}[];
	isSubmitting: boolean;
	onSubmit: (data: SongFormData) => Promise<void>;
	slideOrder: string[];
	slides: Record<string, Slide>;
	fields: string[];
	slug: string;
	setSlideOrder: (newOrder: string[]) => void;
	setSlides: (newSlides: Record<string, Slide>) => void;
	toggleField: (field: string, checked: boolean) => void;
	handleFormSubmit: (event: React.FormEvent) => Promise<void>;
	formRef: React.RefObject<HTMLFormElement | null>;
} {
	const songId = useParams<{ song_id?: string }>().song_id;
	const formRef = useRef<HTMLFormElement>(null);

	// Initialize slides state with a unique ID
	const [firstId] = useState(() => {
		// Use crypto.randomUUID if available, fallback to Math.random for dev
		if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
			return crypto.randomUUID().slice(0, 11);
		}
		// eslint-disable-next-line sonarjs/pseudo-random -- Safe for non-cryptographic ID generation
		return Math.random().toString(36).slice(2, 11);
	});

	const [slideOrder, setSlideOrder] = useState<string[]>([firstId]);
	const [slides, setSlides] = useState<Record<string, Slide>>({
		[firstId]: {
			slide_name: "Slide 1",
			field_data: {},
		},
	});
	// Made fields stateful
	const [fields, setFields] = useState<string[]>(["lyrics"]);
	const [slug] = useState<string>("");

	const initialValues: Partial<SongFormData> = {
		song_id: songId,
		song_name: "",
		song_slug: "",
		short_credit: "",
		long_credit: "",
		private_notes: "",
		public_notes: "",
		fields: ["lyrics"],
		slide_order: [firstId],
		slides: {
			[firstId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		},
	};

	const {
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		isSubmitting,
		validationErrors,
		handleApiResponseEffect,
	} = useAppForm({
		schema: songFormSchema as Schema.Schema<SongFormData, SongFormData, never>,
		formRef,
		initialValues,
	});

	const onSubmit = async (rawData: SongFormData): Promise<void> => {
		try {
			const response = await fetch("/api/songs/save", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(rawData),
				credentials: "include",
			});

			const isSuccess = await Effect.runPromise(
				handleApiResponseEffect(response, () => {
					// Handle API errors through the form system
				}),
			);

			if (isSuccess) {
				// Success - optionally redirect or show success message
			}
		} catch (error) {
			console.error("Network error:", error);
		}
	};

	// Handle form submission with data collection
	const handleFormSubmit = async (event: React.FormEvent): Promise<void> => {
		event.preventDefault();

		// Read form data
		const formDataObj = new FormData(formRef.current || undefined);
		const currentFormData: Record<string, unknown> = {};
		for (const [key, value] of formDataObj.entries()) {
			safeSet(currentFormData, key, value.toString());
		}

		// Add controlled state values that aren't captured by FormData
		currentFormData["fields"] = fields;
		currentFormData["slide_order"] = slideOrder;
		currentFormData["slides"] = slides;

		await handleSubmit(currentFormData, onSubmit);
	};

	// Update internal state when form data changes
	const updateSlideOrder = useCallback((newOrder: string[]) => {
		setSlideOrder(newOrder);
	}, []);

	const updateSlides = useCallback((newSlides: Record<string, Slide>) => {
		setSlides(newSlides);
	}, []);

	// Handle field checkbox changes
	const toggleField = useCallback((field: string, checked: boolean) => {
		setFields((currentFields) => {
			if (checked) {
				// Add field if not already present
				return currentFields.includes(field)
					? currentFields
					: [...currentFields, field];
			}
			// Remove field
			return currentFields.filter((fieldName) => fieldName !== field);
		});
	}, []);

	return {
		handleFieldBlur,
		getFieldError,
		handleSubmit,
		validationErrors,
		isSubmitting,
		onSubmit,
		slideOrder,
		slides,
		fields,
		slug,
		setSlideOrder: updateSlideOrder,
		setSlides: updateSlides,
		toggleField,
		handleFormSubmit,
		formRef,
	};
}
