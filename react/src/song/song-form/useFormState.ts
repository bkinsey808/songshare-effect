import { useState } from "react";

import type { Slide } from "./songTypes";
import { generateId } from "./utils/generateId";

type UseFormStateReturn = {
	slideOrder: ReadonlyArray<string>;
	slides: Record<string, Slide>;
	fields: string[];
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
	setSlides: (newSlides: Record<string, Slide>) => void;
	toggleField: (field: string, checked: boolean) => void;
	resetFormState: () => void;
	initialSlideId: string;
};

export function useFormState(): UseFormStateReturn {
	// Initialize slides state with a unique ID
	const [initialSlideId] = useState(() => generateId());

	const [slideOrder, setSlideOrder] = useState<ReadonlyArray<string>>([
		initialSlideId,
	]);
	const [slides, setSlides] = useState<Record<string, Slide>>({
		[initialSlideId]: {
			slide_name: "Slide 1",
			field_data: {},
		},
	});
	// Made fields stateful
	const [fields, setFields] = useState<string[]>(["lyrics"]);

	// Handle field checkbox changes
	const toggleField = (field: string, checked: boolean): void => {
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
	};

	// Reset form state to initial values
	const resetFormState = (): void => {
		// Generate a new first slide ID
		const newFirstId = generateId();

		// Reset all state to initial values
		setSlideOrder([newFirstId]);
		setSlides({
			[newFirstId]: {
				slide_name: "Slide 1",
				field_data: {},
			},
		});
		setFields(["lyrics"]);
	};

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
