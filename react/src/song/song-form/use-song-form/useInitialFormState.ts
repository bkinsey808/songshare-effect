import { useEffect, useRef } from "react";

import type { FormState } from "../song-form-types";

type UseInitialFormStateParams = {
	readonly songId: string | undefined;
	readonly formValues: FormState["formValues"];
	readonly slideOrder: FormState["slideOrder"];
	readonly tags: FormState["tags"];
	readonly slides: FormState["slides"];
	readonly isLoadingData: boolean;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly setInitialState: (state: FormState) => void;
};

/**
 * Hook that manages setting the initial form state snapshot after the form is populated.
 * Ensures initial state is only set once per songId after data is loaded.
 *
 * @param songId - Optional song id being edited
 * @param formValues - Current controlled form values
 * @param slideOrder - Current slide order array
 * @param tags - Current tag list
 * @param slides - Slide map used to build a deep copy
 * @param isLoadingData - Whether the form is still loading data
 * @param hasPopulatedRef - Ref indicating the form has been populated from data
 * @param setInitialState - Setter to store the initial snapshot of form state
 * @returns void
 */
export default function useInitialFormState({
	songId,
	formValues,
	slideOrder,
	tags,
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
		isLoadingData,
		hasPopulatedRef,
		setInitialState,
	]);
}
