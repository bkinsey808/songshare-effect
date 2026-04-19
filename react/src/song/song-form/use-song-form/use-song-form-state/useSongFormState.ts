import { useEffect, useRef, useState } from "react";

import useFormChanges from "@/react/lib/form/useFormChanges";
import {
	type FormState,
	type Slide,
	type SongFormValues,
} from "@/react/song/song-form/song-form-types";
import { type SongFormValuesFromSchema as SongFormData } from "@/react/song/song-form/songSchema";
import generateId from "@/react/song/song-form/use-song-form/generate/generateId";
import deriveSongChords from "@/shared/song/deriveSongChords";
import deriveSongFieldKeys from "@/shared/song/deriveSongFieldKeys";

import useSetInitialStateAfterChords from "./useSetInitialStateAfterChords";
import useSongFormInitialValues from "./useSongFormInitialValues";
import useSongFormValues from "./useSongFormValues";

type UseSongFormStateParams = {
	readonly formRef: React.RefObject<HTMLFormElement | null>;
	readonly songId: string | undefined;
	readonly isLoadingData: boolean;
	readonly isChangeTrackingReady: boolean;
	readonly tags: readonly string[];
	readonly hasPopulatedRef: React.RefObject<boolean>;
};

type UseSongFormStateReturn = {
	readonly formValues: SongFormValues;
	readonly setFormValuesState: React.Dispatch<React.SetStateAction<SongFormValues>>;
	readonly setFormValue: <Field extends keyof SongFormValues>(
		field: Field,
		value: SongFormValues[Field],
	) => void;
	readonly handleSongNameBlur: () => void;
	readonly resetFormValues: () => SongFormValues;
	readonly fields: readonly string[];
	readonly currentFormState: FormState;
	readonly hasUnsavedChanges: () => boolean;
	readonly setInitialState: (state: FormState) => void;
	readonly clearInitialState: () => void;
	readonly initialValues: Partial<SongFormData>;
	readonly resetForm: () => void;
	readonly updateSlideOrder: (newOrder: readonly string[]) => void;
	readonly updateSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	readonly slideOrder: readonly string[];
	readonly slides: Record<string, Slide>;
	readonly setSlideOrder: (newOrder: readonly string[]) => void;
	readonly setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	readonly resetFormState: () => string;
	readonly initialSlideId: string;
};

/**
 * @param formRef - Reference to the backing DOM form element
 * @param songId - Song id being edited (undefined for new songs)
 * @param isLoadingData - Whether form data is currently being fetched
 * @param isChangeTrackingReady - Whether async form dependencies are ready for dirty tracking
 * @param tags - Array of tags applied to the song
 * @param hasPopulatedRef - Ref tracking whether form has been populated
 * @returns Consolidated form state and helpers
 */
export default function useSongFormState({
	formRef,
	songId,
	isLoadingData,
	isChangeTrackingReady,
	tags,
	hasPopulatedRef,
}: UseSongFormStateParams): UseSongFormStateReturn {
	// Initialize slides state with a unique ID
	const [initialSlideId] = useState(() => generateId());

	const [slideOrder, setSlideOrder] = useState<readonly string[]>([initialSlideId]);
	const [slides, setSlides] = useState<Record<string, Slide>>({
		[initialSlideId]: {
			slide_name: "Slide 1",
			field_data: {},
		},
	});

	/**
	 * Reset slides and slide order to initial defaults.
	 *
	 * @returns New first slide id generated for the reset state
	 */
	function resetFormState(): string {
		const newFirstId = generateId();
		setSlideOrder([newFirstId]);
		setSlides({
			[newFirstId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		});
		return newFirstId;
	}
	// Get form values and mutation helpers
	const { formValues, setFormValuesState, setFormValue, handleSongNameBlur, resetFormValues } =
		useSongFormValues({ formRef });

	// Derive active display fields from language pickers in formValues
	const fields: readonly string[] = deriveSongFieldKeys({
		lyrics: formValues.lyrics,
		script: formValues.script,
		translations: formValues.translations,
	});

	// Combine all form state for change tracking
	const currentFormState: FormState = {
		formValues,
		slideOrder,
		tags,
		slides,
	};

	// Use generic form changes hook - default deep equality comparison handles nested state
	const { hasUnsavedChanges, setInitialState, clearInitialState } = useFormChanges<FormState>({
		currentState: currentFormState,
		enabled: isChangeTrackingReady,
	});

	// Build initial form values
	const initialValues = useSongFormInitialValues({
		songId,
		initialSlideId,
	});

	// Track if we've set initial state for the current songId
	const hasSetInitialStateRef = useRef<string | undefined>(undefined);

	// Set the initial form state snapshot based on create vs edit mode
	useEffect(() => {
		// For new songs: set initial state once when not loading
		if (songId === undefined || songId.trim() === "") {
			const NEW_SONG_MARKER = "";
			if (hasSetInitialStateRef.current === NEW_SONG_MARKER) {
				return;
			}
			if (!isChangeTrackingReady || isLoadingData) {
				return;
			}
			setInitialState({
				formValues: { ...formValues },
				slideOrder: [...slideOrder],
				tags: [...tags],
				slides: Object.fromEntries(
					Object.entries(slides).map(([key, slide]) => [
						key,
						{
							...slide,
							field_data: { ...slide.field_data },
						},
					]),
				),
			});
			hasSetInitialStateRef.current = NEW_SONG_MARKER;
			return;
		}

		// For editing: only set initial state once after form is populated
		if (!isChangeTrackingReady || !hasPopulatedRef.current || isLoadingData) {
			return;
		}

		if (hasSetInitialStateRef.current === songId) {
			return;
		}

		setInitialState({
			formValues: { ...formValues },
			slideOrder: [...slideOrder],
			tags: [...tags],
			slides: Object.fromEntries(
				Object.entries(slides).map(([key, slide]) => [
					key,
					{
						...slide,
						field_data: { ...slide.field_data },
					},
				]),
			),
		});
		hasSetInitialStateRef.current = songId;
	}, [
		formValues,
		slideOrder,
		tags,
		slides,
		songId,
		isChangeTrackingReady,
		isLoadingData,
		hasPopulatedRef,
		setInitialState,
	]);

	// Keep the song-level chord cache aligned with live lyrics content and slide order.
	useEffect(() => {
		setFormValuesState((previousValues: SongFormValues) => {
			const nextChords = deriveSongChords({
				slideOrder,
				slides,
				existingChords: previousValues.chords,
			});
			const chordsUnchanged =
				previousValues.chords.length === nextChords.length &&
				previousValues.chords.every((token: string, index: number) => token === nextChords[index]);

			return chordsUnchanged
				? previousValues
				: {
						...previousValues,
						chords: nextChords,
					};
		});
	}, [setFormValuesState, slideOrder, slides]);

	useSetInitialStateAfterChords({
		isChangeTrackingReady,
		isLoadingData,
		hasPopulatedRef,
		formValues,
		slideOrder,
		tags,
		slides,
		setInitialState,
	});

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
		setInitialState({
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

	return {
		formValues,
		setFormValuesState,
		setFormValue,
		handleSongNameBlur,
		resetFormValues,
		fields,
		currentFormState,
		hasUnsavedChanges,
		setInitialState,
		clearInitialState,
		initialValues,
		resetForm,
		updateSlideOrder,
		updateSlides,
		slideOrder,
		slides,
		setSlideOrder,
		setSlides,
		resetFormState,
		initialSlideId,
	};
}
