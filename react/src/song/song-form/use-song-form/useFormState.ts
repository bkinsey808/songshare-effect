import { useState } from "react";

import { type Slide } from "../song-form-types";
import generateId from "./generate/generateId";

type UseFormStateReturn = {
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
	setSlideOrder: (newOrder: readonly string[]) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	/** Resets slides to a single new slide. Returns the new slide id so callers can sync initial state. */
	resetFormState: () => string;
	initialSlideId: string;
};

/**
 * Hook that encapsulates form-local state for slides and slide order.
 * Active language fields are now derived from `formValues` (lyrics/script/translations).
 *
 * @returns Object exposing `slideOrder`, `slides`, and helpers to mutate them
 */
export default function useFormState(): UseFormStateReturn {
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

	return {
		slideOrder,
		slides,
		setSlideOrder,
		setSlides,
		resetFormState,
		initialSlideId,
	};
}
