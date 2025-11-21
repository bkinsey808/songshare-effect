/**
 * Utility functions for slide management
 */
import { type Slide } from "../songTypes";

/**
 * Generate a random ID for slides
 */
export function randomId(): string {
	// eslint-disable-next-line sonarjs/pseudo-random -- Safe for non-cryptographic ID generation
	return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Generate the next available slide name
 */
export function getNextSlideName(
	slides: Readonly<Record<string, Slide>>,
	slideOrderLength: number,
): string {
	let idx = 1;
	let newSlideName = `Slide ${String(slideOrderLength + 1)}`;
	const names = Object.values(slides).map((slide) => slide.slide_name);
	while (names.includes(newSlideName)) {
		idx++;
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

	if (slideNumberMatch !== null && slideNumberMatch[1] !== undefined) {
		const originalNumber = parseInt(slideNumberMatch[1], 10);
		const nextSequentialName = `Slide ${originalNumber + 1}`;

		// If the next sequential name doesn't exist, use it
		if (!existingNames.includes(nextSequentialName)) {
			return nextSequentialName;
		}
	}

	// Otherwise, fall back to the (Copy) pattern
	let copyName = `${originalSlideName} (Copy)`;
	let copyIndex = 2;

	// If "(Copy)" already exists, try "(Copy 2)", "(Copy 3)", etc.
	while (existingNames.includes(copyName)) {
		copyName = `${originalSlideName} (Copy ${copyIndex})`;
		copyIndex++;
	}

	return copyName;
}
