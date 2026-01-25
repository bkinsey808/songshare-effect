import { type Slide } from "../song-form-types";

const ONE = 1;

/**
 * Generate the next available slide name
 */
export default function getNextSlideName(
	slides: Readonly<Record<string, Slide>>,
	slideOrderLength: number,
): string {
	let idx = ONE;
	let newSlideName = `Slide ${String(slideOrderLength + ONE)}`;
	const names = new Set(Object.values(slides).map((slide) => slide.slide_name));
	while (names.has(newSlideName)) {
		idx += ONE;
		newSlideName = `Slide ${String(slideOrderLength + idx)}`;
	}
	return newSlideName;
}
