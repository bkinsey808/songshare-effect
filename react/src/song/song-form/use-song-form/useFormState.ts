import { useState } from "react";

import { type Slide } from "../song-form-types";
import generateId from "./generate/generateId";

type UseFormStateReturn = {
	slideOrder: readonly string[];
	slides: Record<string, Slide>;
	fields: readonly string[];
	setSlideOrder: (newOrder: readonly string[]) => void;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
	toggleField: (field: string, checked: boolean) => void;
	/** Resets slides to a single new slide. Returns the new slide id so callers can sync initial state. */
	resetFormState: () => string;
	initialSlideId: string;
};

/**
 * Hook that encapsulates form-local state for slides, fields and slide order
 *
 * @returns Object exposing `slideOrder`, `slides`, `fields`, and helpers to mutate them
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
	// Made fields stateful
	const [fields, setFields] = useState<readonly string[]>(["lyrics"]);

	// Handle field checkbox changes
	function toggleField(field: string, checked: boolean): void {
		setFields((currentFields) => {
			if (checked) {
				// Add field if not already present
				return currentFields.includes(field) ? currentFields : [...currentFields, field];
			}
			// Remove field
			return currentFields.filter((fieldName) => fieldName !== field);
		});
	}

	// Reset form state to initial values
	function resetFormState(): string {
		const newFirstId = generateId();
		setSlideOrder([newFirstId]);
		setSlides({
			[newFirstId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		});
		setFields(["lyrics"]);
		return newFirstId;
	}

	return {
		slideOrder,
		slides,
		fields,
		setSlideOrder,
		setSlides,
		toggleField,
		resetFormState,
		initialSlideId,
	};
}
