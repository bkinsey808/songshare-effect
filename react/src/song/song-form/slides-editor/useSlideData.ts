/**
 * Custom hook for managing slide data CRUD operations
 */
import { type Slide } from "../songTypes";
import {
	getDuplicateSlideName,
	getNextSlideName,
	randomId,
} from "./slideUtils";
import { safeGet } from "@/shared/utils/safe";

type UseSlideDataParams = Readonly<{
	slideOrder: ReadonlyArray<string>;
	setSlideOrder: (newOrder: ReadonlyArray<string>) => void;
	slides: Readonly<Record<string, Slide>>;
	setSlides: (newSlides: Readonly<Record<string, Slide>>) => void;
}>;

type UseSlideDataReturn = {
	addSlide: () => void;
	deleteSlide: (slideId: string) => void;
	duplicateSlide: (slideId: string) => void;
};

export function useSlideData({
	slideOrder,
	setSlideOrder,
	slides,
	setSlides,
}: UseSlideDataParams): UseSlideDataReturn {
	const addSlide = (): void => {
		const id = randomId();
		const newSlideName = getNextSlideName(slides, slideOrder.length);
		setSlideOrder([...slideOrder, id]);
		setSlides({
			...slides,
			[id]: {
				slide_name: newSlideName,
				// Initialize field_data with empty strings for ALL possible fields
				// This ensures the data structure is ready for any field that might be checked later
				field_data: {
					lyrics: "",
					script: "",
					englishTranslation: "",
					// Add any other possible fields here
				},
			},
		});
	};

	// Duplicate a slide (creates a new slide with copied data)
	const duplicateSlide = (slideId: string): void => {
		const originalSlide = safeGet(slides, slideId);
		if (!originalSlide) {
			console.error("Original slide not found for ID:", slideId);
			return;
		}

		console.warn("Duplicating slide:", originalSlide.slide_name);
		console.warn(
			"Current slides:",
			Object.values(slides).map((slide) => slide.slide_name),
		);

		const newId = randomId();
		const newSlideName = getDuplicateSlideName(
			originalSlide.slide_name,
			slides,
		);

		console.warn("Generated new slide name:", newSlideName);

		// Create new slide with copied data
		setSlides({
			...slides,
			[newId]: {
				slide_name: newSlideName,
				field_data: {
					// Copy all field data from the original slide
					...originalSlide.field_data,
				},
			},
		});

		// Add the new slide to the presentation order
		setSlideOrder([...slideOrder, newId]);
	};

	// Remove a slide
	const deleteSlide = (slideId: string): void => {
		if (slideOrder.length === 1) {
			return;
		}
		const newOrder = slideOrder.filter((id) => id !== slideId);
		const newSlides = Object.fromEntries(
			Object.entries(slides).filter(([id]) => id !== slideId),
		);
		setSlideOrder(newOrder);
		setSlides(newSlides);
	};

	return {
		addSlide,
		deleteSlide,
		duplicateSlide,
	};
}
