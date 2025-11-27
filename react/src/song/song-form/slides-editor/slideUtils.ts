/**
 * Utility functions for slide management
 */
import { type Slide } from "../songTypes";

const SLIDE_NUMBER_CAPTURE_INDEX = 1;
const PARSE_RADIX = 10;
const ONE = 1;
const COPY_INDEX_START = 2;

/**
 * Generate a random ID for slides
 */
export function randomId(): string {
	const RADIX = 36;
	const ID_SLICE_START = 2;
	const ID_SLICE_END = 10;

	return (
		Math.random().toString(RADIX).slice(ID_SLICE_START, ID_SLICE_END) +
		Date.now().toString(RADIX)
	);
}

/**
 * Generate the next available slide name
 */
export function getNextSlideName(
	slides: Readonly<Record<string, Slide>>,
	slideOrderLength: number,
): string {
	let idx = ONE;
	let newSlideName = `Slide ${String(slideOrderLength + ONE)}`;
	const names = Object.values(slides).map((slide) => slide.slide_name);
	while (names.includes(newSlideName)) {
		idx += ONE;
		newSlideName = `Slide ${String(slideOrderLength + idx)}`;
	}
	return newSlideName;
}

/**
 * Generate a smart duplicate name for a slide
 * If the original slide follows "Slide N" pattern and "Slide N+1" doesn't exist,
 * use "Slide N+1" instead of "Slide N (Copy)"
 */
export function getDuplicateSlideName(
	originalSlideName: string,
	slides: Readonly<Record<string, Slide>>,
): string {
	const existingNames = Object.values(slides).map((slide) => slide.slide_name);

	// Check if the original name follows "Slide N" pattern
	const slideNumberRegex = /^Slide (\d+)$/;
	const slideNumberMatch = slideNumberRegex.exec(originalSlideName);

	if (
		slideNumberMatch !== null &&
		slideNumberMatch[SLIDE_NUMBER_CAPTURE_INDEX] !== undefined
	) {
		const originalNumber = parseInt(
			slideNumberMatch[SLIDE_NUMBER_CAPTURE_INDEX],
			PARSE_RADIX,
		);
		const nextSequentialName = `Slide ${originalNumber + ONE}`;

		// If the next sequential name doesn't exist, use it
		if (!existingNames.includes(nextSequentialName)) {
			return nextSequentialName;
		}
	}

	// Otherwise, fall back to the (Copy) pattern
	let copyName = `${originalSlideName} (Copy)`;
	let copyIndex = COPY_INDEX_START;

	// If "(Copy)" already exists, try "(Copy 2)", "(Copy 3)", etc.
	while (existingNames.includes(copyName)) {
		copyName = `${originalSlideName} (Copy ${copyIndex})`;
		copyIndex += ONE;
	}

	return copyName;
}
