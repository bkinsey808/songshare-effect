import { useEffect, useState } from "react";

import { safeGet } from "@/shared/utils/safe";

import { type SongPublic, songFields } from "../song-schema";

const MIN_SLIDE_INDEX = 0;
const ONE = 1;

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

export function useSongViewSlides(
	songPublic: SongPublic | undefined,
): UseSongViewSlidesResult {
	const slideOrder = songPublic?.slide_order ?? [];
	const slides = songPublic?.slides ?? {};
	const fields = songPublic?.fields ?? [];
	const totalSlides = slideOrder.length;

	const [currentIndex, setCurrentIndex] = useState(MIN_SLIDE_INDEX);
	const clampedIndex =
		totalSlides === MIN_SLIDE_INDEX
			? MIN_SLIDE_INDEX
			: Math.min(Math.max(MIN_SLIDE_INDEX, currentIndex), totalSlides - ONE);

	useEffect(() => {
		if (clampedIndex !== currentIndex) {
			setCurrentIndex(clampedIndex);
		}
	}, [clampedIndex, currentIndex]);

	function goFirst(): void {
		setCurrentIndex(MIN_SLIDE_INDEX);
	}
	function goPrev(): void {
		setCurrentIndex((i) => Math.max(MIN_SLIDE_INDEX, i - ONE));
	}
	function goNext(): void {
		setCurrentIndex((i) => Math.min(totalSlides - ONE, i + ONE));
	}
	function goLast(): void {
		setCurrentIndex(Math.max(MIN_SLIDE_INDEX, totalSlides - ONE));
	}

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

	const currentSlideId =
		totalSlides > MIN_SLIDE_INDEX ? slideOrder[clampedIndex] : undefined;
	const currentSlide =
		currentSlideId === undefined
			? undefined
			: safeGet(slides as Record<string, unknown>, currentSlideId);

	const displayFields =
		fields.length > MIN_SLIDE_INDEX ? [...fields] : [...songFields];

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
