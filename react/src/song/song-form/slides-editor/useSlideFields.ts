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
	/**
	 * Safely retrieve a field value from slides.
	 *
	 * @param slides - Slides map to search
	 * @param slideId - Slide id to lookup
	 * @param field - Field key to retrieve
	 * @returns The field value or empty string when missing
	 */
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

	/**
	 * Update a single field value for a slide, preserving other fields.
	 *
	 * @param slideId - Slide id to update
	 * @param field - Field key to update
	 * @param value - New string value for the field
	 * @returns void
	 */
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

	/**
	 * Edit the slide's name.
	 *
	 * @param slideId - Slide id to rename
	 * @param newName - New slide name
	 * @returns void
	 */
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

	/**
	 * Update slide background image metadata.
	 *
	 * @param slideId - Slide id to update
	 * @param backgroundImageId - Optional image id from library
	 * @param backgroundImageUrl - Optional image URL
	 * @param backgroundImageWidth - Optional image width
	 * @param backgroundImageHeight - Optional image height
	 * @param backgroundImageFocalPointX - Optional focal X coordinate
	 * @param backgroundImageFocalPointY - Optional focal Y coordinate
	 * @returns void
	 */
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
