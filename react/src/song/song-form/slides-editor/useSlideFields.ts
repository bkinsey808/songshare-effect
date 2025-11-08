/**
 * Custom hook for managing slide field operations
 */
import { type Slide } from "../songTypes";
import { safeGet } from "@/shared/utils/safe";

export function useSlideFields({
	slides,
	setSlides,
}: {
	slides: Record<string, Slide>;
	setSlides: (newSlides: Record<string, Slide>) => void;
}): {
	editFieldValue: ({
		slideId,
		field,
		value,
	}: {
		slideId: string;
		field: string;
		value: string;
	}) => void;
	editSlideName: ({
		slideId,
		newName,
	}: {
		slideId: string;
		newName: string;
	}) => void;
	safeGetField: (params: {
		slides: Record<string, Slide>;
		slideId: string;
		field: string;
	}) => string;
} {
	// Edit field value - preserve all existing field data
	const safeGetField = (params: {
		slides: Record<string, Slide>;
		slideId: string;
		field: string;
	}): string => {
		const slide = safeGet(params.slides, params.slideId);
		if (!slide) {
			return "";
		}
		// Return the field value or empty string if it doesn't exist
		return safeGet(slide.field_data, params.field) || "";
	};

	const editFieldValue = ({
		slideId,
		field,
		value,
	}: {
		slideId: string;
		field: string;
		value: string;
	}): void => {
		const currentSlide = safeGet(slides, slideId);
		if (!currentSlide) {
			return;
		}

		setSlides({
			...slides,
			[slideId]: {
				...currentSlide,
				field_data: {
					// CRITICAL: Preserve ALL existing field data
					...currentSlide.field_data,
					[field]: value,
				},
			},
		});
	};

	// Edit slide name inside the slide
	const editSlideName = ({
		slideId,
		newName,
	}: {
		slideId: string;
		newName: string;
	}): void => {
		const currentSlide = safeGet(slides, slideId);
		if (!currentSlide) {
			return;
		}

		setSlides({
			...slides,
			[slideId]: {
				...currentSlide,
				slide_name: newName,
			},
		});
	};

	return {
		editFieldValue,
		editSlideName,
		safeGetField,
	};
}
