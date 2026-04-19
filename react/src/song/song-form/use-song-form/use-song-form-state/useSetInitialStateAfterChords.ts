import { useEffect } from "react";

import type { FormState } from "@/react/song/song-form/song-form-types";

type UseSetInitialStateAfterChordsParams = {
	readonly isLoadingData: boolean;
	readonly isChangeTrackingReady: boolean;
	readonly hasPopulatedRef: React.RefObject<boolean>;
	readonly formValues: FormState["formValues"];
	readonly slideOrder: FormState["slideOrder"];
	readonly tags: FormState["tags"];
	readonly slides: FormState["slides"];
	readonly setInitialState: (state: FormState) => void;
};

/**
 * Hook that sets the initial form state after chords have been derived.
 * This ensures the change-tracking baseline includes computed chords,
 * so user edits are properly detected as changes.
 *
 * @param isLoadingData - Whether form data is still loading
 * @param isChangeTrackingReady - Whether async dependencies like tags have loaded
 * @param hasPopulatedRef - Ref indicating if form has been populated
 * @param formValues - Current form values (including computed chords)
 * @param slideOrder - Current slide order
 * @param tags - Current tags
 * @param slides - Current slides map
 * @param setInitialState - Callback to set the initial state baseline
 * @returns void
 */
export default function useSetInitialStateAfterChords({
	isLoadingData,
	isChangeTrackingReady,
	hasPopulatedRef,
	formValues,
	slideOrder,
	tags,
	slides,
	setInitialState,
}: UseSetInitialStateAfterChordsParams): void {
	// Set the baseline for change tracking after chords are computed and form is populated
	useEffect(() => {
		if (isChangeTrackingReady && !isLoadingData && hasPopulatedRef.current) {
			setInitialState({
				formValues,
				slideOrder,
				tags,
				slides,
			});
		}
	}, [
		formValues,
		slideOrder,
		tags,
		slides,
		isChangeTrackingReady,
		isLoadingData,
		setInitialState,
		hasPopulatedRef,
	]);
}
