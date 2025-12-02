/**
 * Custom hook for managing slide field operations
 */
import { safeGet } from "@/shared/utils/safe";

import { type Slide } from "../songTypes";

type EditFieldValue = ({
	slideId,
	field,
	value,
}: Readonly<{
	slideId: string;
	field: string;
	value: string;
}>) => void;

type EditSlideName = ({
	slideId,
	newName,
}: Readonly<{
	slideId: string;
	newName: string;
}>) => void;

type SafeGetField = (
	params: Readonly<{
		slides: Readonly<Record<string, Slide>>;
		slideId: string;
		field: string;
	}>,
) => string;

type UseSlideFieldsParams = Readonly<{
	slides: Readonly<Record<string, Slide>>;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
}>;

type UseSlideFieldsReturn = {
	editFieldValue: EditFieldValue;
	editSlideName: EditSlideName;
	safeGetField: SafeGetField;
};

export default function useSlideFields({
	slides,
	setSlides,
}: UseSlideFieldsParams): UseSlideFieldsReturn {
	// Edit field value - preserve all existing field data
	function safeGetField({
		slides: innerSlides,
		slideId,
		field,
	}: Readonly<{
		slides: Readonly<Record<string, Slide>>;
		slideId: string;
		field: string;
	}>): string {
		const slide = safeGet(innerSlides, slideId);
		if (!slide) {
			return "";
		}
		// Return the field value or empty string if it doesn't exist
		return safeGet(slide.field_data, field) ?? "";
	}

	function editFieldValue({
		slideId,
		field,
		value,
	}: Readonly<{
		slideId: string;
		field: string;
		value: string;
	}>): void {
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
	}

	// Edit slide name inside the slide
	function editSlideName({
		slideId,
		newName,
	}: Readonly<{
		slideId: string;
		newName: string;
	}>): void {
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
	}

	return {
		editFieldValue,
		editSlideName,
		safeGetField,
	};
}
