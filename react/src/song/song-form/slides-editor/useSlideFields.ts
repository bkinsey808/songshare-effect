import { safeGet } from "@/shared/utils/safe";

import { type Slide } from "../song-form-types";

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
	editSlideBackgroundImage: ({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
		backgroundImageWidth,
		backgroundImageHeight,
		backgroundImageFocalPointX,
		backgroundImageFocalPointY,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string | undefined;
		backgroundImageUrl: string | undefined;
		backgroundImageWidth: number | undefined;
		backgroundImageHeight: number | undefined;
		backgroundImageFocalPointX: number | undefined;
		backgroundImageFocalPointY: number | undefined;
	}>) => void;
	safeGetField: SafeGetField;
};

/**
 * Custom hook for managing slide field operations.
 *
 * @param slides - Current slides record
 * @param setSlides - Setter to update slides
 * @returns Handlers to edit field values and slide names and to safely access a field value
 */
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

	function editSlideBackgroundImage({
		slideId,
		backgroundImageId,
		backgroundImageUrl,
		backgroundImageWidth,
		backgroundImageHeight,
		backgroundImageFocalPointX,
		backgroundImageFocalPointY,
	}: Readonly<{
		slideId: string;
		backgroundImageId: string | undefined;
		backgroundImageUrl: string | undefined;
		backgroundImageWidth: number | undefined;
		backgroundImageHeight: number | undefined;
		backgroundImageFocalPointX: number | undefined;
		backgroundImageFocalPointY: number | undefined;
	}>): void {
		const currentSlide = safeGet(slides, slideId);
		if (!currentSlide) {
			return;
		}

		setSlides({
			...slides,
			[slideId]: {
				...currentSlide,
				background_image_id: backgroundImageId,
				background_image_url: backgroundImageUrl,
				background_image_width: backgroundImageWidth,
				background_image_height: backgroundImageHeight,
				background_image_focal_point_x: backgroundImageFocalPointX,
				background_image_focal_point_y: backgroundImageFocalPointY,
			},
		});
	}

	return {
		editFieldValue,
		editSlideName,
		editSlideBackgroundImage,
		safeGetField,
	};
}
