import { useEffect, useRef } from "react";

import type { FormState } from "../song-form-types";

type UseInitialFormStateParams = {
	readonly songId: string | undefined;
	readonly formValues: FormState["formValues"];
	readonly fields: FormState["fields"];
	readonly slideOrder: FormState["slideOrder"];
	readonly slides: FormState["slides"];
	readonly isLoadingData: boolean;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly setInitialState: (state: FormState) => void;
};

/**
 * Hook that manages setting the initial form state snapshot after the form is populated.
 * Ensures initial state is only set once per songId after data is loaded.
 *
 * @returns void
 */
export default function useInitialFormState({
	songId,
	formValues,
	fields,
	slideOrder,
	slides,
	isLoadingData,
	hasPopulatedRef,
	setInitialState,
}: UseInitialFormStateParams): void {
	// Use a ref to track if we've set initial state for the current songId
	const hasSetInitialStateRef = useRef<string | undefined>(undefined);

	// Set the initial form state snapshot once data is loaded/populated
	useEffect(() => {
		// For new songs: set initial state once when not loading
		if (songId === undefined || songId.trim() === "") {
			// New song - set initial state to current empty values once
			// Use a special marker to track that we've set initial state for new song
			const NEW_SONG_MARKER = "";
			if (hasSetInitialStateRef.current === NEW_SONG_MARKER) {
				// Already set for new song
				return;
			}
			if (isLoadingData) {
				// Still loading, wait
				return;
			}
			// Set initial state with current form values (deep copy)
			setInitialState({
				formValues: { ...formValues },
				fields: [...fields],
				slideOrder: [...slideOrder],
				slides: Object.fromEntries(
					Object.entries(slides).map(([key, slide]) => [
						key,
						{
							slide_name: slide.slide_name,
							field_data: { ...slide.field_data },
						},
					]),
				),
			});
			hasSetInitialStateRef.current = NEW_SONG_MARKER;
			return;
		}

		// For editing: only set initial state once after form is populated
		if (!hasPopulatedRef.current || isLoadingData) {
			// Still loading or not populated yet
			return;
		}

		// Only set initial state once per songId
		if (hasSetInitialStateRef.current === songId) {
			return;
		}

		// Set initial state with current form values (deep copy)
		setInitialState({
			formValues: { ...formValues },
			fields: [...fields],
			slideOrder: [...slideOrder],
			slides: Object.fromEntries(
				Object.entries(slides).map(([key, slide]) => [
					key,
					{
						slide_name: slide.slide_name,
						field_data: { ...slide.field_data },
					},
				]),
			),
		});
		hasSetInitialStateRef.current = songId;
	}, [
		formValues,
		fields,
		slideOrder,
		slides,
		songId,
		isLoadingData,
		hasPopulatedRef,
		setInitialState,
	]);
}
