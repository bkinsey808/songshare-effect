import { useEffect, useState } from "react";

import { ONE } from "@/shared/constants/shared-constants";
import { safeGet } from "@/shared/utils/safe";

import { type SongPublic, songFields } from "../song-schema";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;

/**
 * Result object returned by `useSongViewSlides`.
 *
 * Contains the current slide state, navigation helpers, and computed fields for rendering.
 */
export type UseSongViewSlidesResult = {
	clampedIndex: number;
	currentSlide: unknown;
	displayFields: readonly string[];
	goFirst: () => void;
	goLast: () => void;
	goNext: () => void;
	goPrev: () => void;
	totalSlides: number;
};

/**
 * Hook for managing slide navigation and selection within the Song view.
 *
 * Keeps an internal current index clamped to the available slides, provides keyboard
 * navigation and helper functions for first/last/next/prev navigation.
 *
 * @param songPublic - The public song payload (may be undefined while loading).
 * @returns clampedIndex - the current index clamped to the valid slide range
 * @returns currentSlide - the resolved slide object for the current index, or
 *   `undefined` when there is no slide
 * @returns displayFields - ordered list of field keys to render for the slide
 * @returns goFirst - navigate to the first slide (index 0)
 * @returns goLast - navigate to the last slide safely (handles zero slides)
 * @returns goNext - navigate to the next slide (clamped to last)
 * @returns goPrev - navigate to the previous slide (clamped to 0)
 * @returns totalSlides - number of slides available (0 when none)
 */
export function useSongViewSlides(songPublic: SongPublic | undefined): UseSongViewSlidesResult {
	const slideOrder = songPublic?.slide_order ?? [];
	const slides = songPublic?.slides ?? {};
	const fields = songPublic?.fields ?? [];
	const totalSlides = slideOrder.length;

	const [currentIndex, setCurrentIndex] = useState(MIN_SLIDE_INDEX);

	/**
	 * Clamp the current index into the valid slide range [0, totalSlides - 1].
	 * When there are no slides the clamped index remains 0.
	 */
	const clampedIndex =
		totalSlides === MIN_SLIDE_INDEX
			? MIN_SLIDE_INDEX
			: Math.min(Math.max(MIN_SLIDE_INDEX, currentIndex), totalSlides - ONE);

	// Keep the internal `currentIndex` in sync with the `clampedIndex`.
	// Ensures the index is corrected if `totalSlides` changes (e.g., load/unload slides).
	useEffect(() => {
		if (clampedIndex !== currentIndex) {
			setCurrentIndex(clampedIndex);
		}
	}, [clampedIndex, currentIndex]);

	/** Navigate to the first slide (index 0). */
	function goFirst(): void {
		setCurrentIndex(MIN_SLIDE_INDEX);
	}

	/** Navigate to the previous slide, clamping at 0 to avoid negative indices. */
	function goPrev(): void {
		setCurrentIndex((i) => Math.max(MIN_SLIDE_INDEX, i - ONE));
	}

	/** Navigate to the next slide, clamping at the last index. */
	function goNext(): void {
		setCurrentIndex((i) => Math.min(totalSlides - ONE, i + ONE));
	}

	/** Navigate to the last slide safely (handles zero slides). */
	function goLast(): void {
		setCurrentIndex(Math.max(MIN_SLIDE_INDEX, totalSlides - ONE));
	}

	// Add global keyboard handlers for Home/End/Arrow keys to support keyboard navigation.
	// Prevent default on handled keys to avoid native actions.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent): void {
			if (totalSlides === MIN_SLIDE_INDEX) {
				return;
			}
			switch (event.key) {
				case "Home": {
					event.preventDefault();
					setCurrentIndex(MIN_SLIDE_INDEX);
					break;
				}
				case "End": {
					event.preventDefault();
					setCurrentIndex(Math.max(MIN_SLIDE_INDEX, totalSlides - ONE));
					break;
				}
				case "ArrowLeft": {
					event.preventDefault();
					setCurrentIndex((idx) => Math.max(MIN_SLIDE_INDEX, idx - ONE));
					break;
				}
				case "ArrowRight": {
					event.preventDefault();
					setCurrentIndex((idx) => Math.min(totalSlides - ONE, idx + ONE));
					break;
				}
				default: {
					break;
				}
			}
		}
		globalThis.addEventListener("keydown", onKeyDown);
		return function cleanup(): void {
			globalThis.removeEventListener("keydown", onKeyDown);
		};
	}, [totalSlides]);

	/**
	 * Resolve the current slide id (if any).
	 * Use `safeGet` to avoid throwing if the slide is missing.
	 * This makes the hook resilient to partial/mutable `slides` objects.
	 */
	const currentSlideId = totalSlides > MIN_SLIDE_INDEX ? slideOrder[clampedIndex] : undefined;
	const currentSlide =
		currentSlideId === undefined
			? undefined
			: safeGet(slides as Record<string, unknown>, currentSlideId);

	/**
	 * Determine which fields to display for the slide.
	 * Fall back to `songFields` defaults when the song doesn't provide custom fields.
	 */
	const displayFields = fields.length > MIN_SLIDE_INDEX ? [...fields] : [...songFields];

	return {
		clampedIndex,
		currentSlide,
		displayFields,
		goFirst,
		goLast,
		goNext,
		goPrev,
		totalSlides,
	};
}
