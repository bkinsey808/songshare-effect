import { type Slide } from "../song-form-types";

const SLIDE_NUMBER_CAPTURE_INDEX = 1;
const PARSE_RADIX = 10;
const ONE = 1;
const COPY_INDEX_START = 2;

/**
 * Generate a smart duplicate name for a slide
 * If the original slide follows "Slide N" pattern and "Slide N+1" doesn't exist,
 * use "Slide N+1" instead of "Slide N (Copy)"
 */
export default function getDuplicateSlideName(
	originalSlideName: string,
	slides: Readonly<Record<string, Slide>>,
): string {
	const existingNames = new Set(Object.values(slides).map((slide) => slide.slide_name));

	// Check if the original name follows "Slide N" pattern
	const slideNumberRegex = /^Slide (\d+)$/;
	const slideNumberMatch = slideNumberRegex.exec(originalSlideName);

	if (slideNumberMatch !== null && slideNumberMatch[SLIDE_NUMBER_CAPTURE_INDEX] !== undefined) {
		const originalNumber = Number.parseInt(
			slideNumberMatch[SLIDE_NUMBER_CAPTURE_INDEX],
			PARSE_RADIX,
		);
		const nextSequentialName = `Slide ${originalNumber + ONE}`;

		// If the next sequential name doesn't exist, use it
		if (!existingNames.has(nextSequentialName)) {
			return nextSequentialName;
		}
	}

	// Otherwise, fall back to the (Copy) pattern
	let copyName = `${originalSlideName} (Copy)`;
	let copyIndex = COPY_INDEX_START;

	// If "(Copy)" already exists, try "(Copy 2)", "(Copy 3)", etc.
	while (existingNames.has(copyName)) {
		copyName = `${originalSlideName} (Copy ${copyIndex})`;
		copyIndex += ONE;
	}

	return copyName;
}
