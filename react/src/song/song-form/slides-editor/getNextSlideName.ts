import { ONE } from "@/shared/constants/shared-constants";

import { type Slide } from "../song-form-types";

/**
 * Generate the next available slide name.
 *
 * @param slides - Existing slides map to avoid name collisions
 * @param slideOrderLength - Current length of slide order used to compute a base number
 * @returns The next unique slide name (e.g., "Slide 2")
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
