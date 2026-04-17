import { useEffect, useState } from "react";

import getSlideOrientationContainerClassName from "@/react/slide-orientation/getSlideOrientationContainerClassName";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { type SongPublic } from "@/react/song/song-schema";
import { ONE } from "@/shared/constants/shared-constants";
import { safeGet } from "@/shared/utils/safe";

/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;
const FALLBACK_VIEWPORT_ASPECT_WIDTH = 16;
const FALLBACK_VIEWPORT_ASPECT_HEIGHT = 9;
const FALLBACK_VIEWPORT_ASPECT_RATIO =
	FALLBACK_VIEWPORT_ASPECT_WIDTH / FALLBACK_VIEWPORT_ASPECT_HEIGHT;

/**
 * Compute a safe viewport aspect ratio using `globalThis` when available.
 * Falls back to a hard-coded 16:9 ratio in non-DOM or degenerate dimensions.
 *
 * @returns The viewport width/height aspect ratio
 */
function getViewportAspectRatio(): number {
	if (typeof globalThis === "undefined") {
		return FALLBACK_VIEWPORT_ASPECT_RATIO;
	}
	if (globalThis.innerWidth <= MIN_SLIDE_INDEX || globalThis.innerHeight <= MIN_SLIDE_INDEX) {
		return FALLBACK_VIEWPORT_ASPECT_RATIO;
	}
	return globalThis.innerWidth / globalThis.innerHeight;
}

/**
 * Result object returned by `useSongViewSlides`.
 *
 * Contains the current slide state, navigation helpers, and computed fields for rendering.
 */
export type UseSongViewSlidesResult = {
	canPortalFullScreen: boolean;
	clampedIndex: number;
	currentSlide: unknown;
	displayFields: readonly string[];
	effectiveSlideOrientation: "landscape" | "portrait";
	goFirst: () => void;
	goLast: () => void;
	goNext: () => void;
	goPrev: () => void;
	isFullScreen: boolean;
	setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
	slideContainerClassName: string;
	totalSlides: number;
	viewportAspectRatio: number;
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
	const totalSlides = slideOrder.length;

	const [currentIndex, setCurrentIndex] = useState(MIN_SLIDE_INDEX);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [viewportAspectRatio, setViewportAspectRatio] = useState(getViewportAspectRatio);
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const slideContainerClassName = getSlideOrientationContainerClassName(effectiveSlideOrientation);
	const canPortalFullScreen = typeof document !== "undefined" && document.body !== null;

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

	/**
	 * Navigate to the first slide (index 0).
	 *
	 * @returns void
	 */
	function goFirst(): void {
		setCurrentIndex(MIN_SLIDE_INDEX);
	}

	/**
	 * Navigate to the previous slide, clamping at 0 to avoid negative indices.
	 *
	 * @returns void
	 */
	function goPrev(): void {
		setCurrentIndex((i) => Math.max(MIN_SLIDE_INDEX, i - ONE));
	}

	/**
	 * Navigate to the next slide, clamping at the last index.
	 *
	 * @returns void
	 */
	function goNext(): void {
		setCurrentIndex((i) => Math.min(totalSlides - ONE, i + ONE));
	}

	/**
	 * Navigate to the last slide safely (handles zero slides).
	 *
	 * @returns void
	 */
	function goLast(): void {
		setCurrentIndex(Math.max(MIN_SLIDE_INDEX, totalSlides - ONE));
	}

	// Add global keyboard handlers for Home/End/Arrow keys to support keyboard navigation.
	// Prevent default on handled keys to avoid native actions.
	useEffect(() => {
		/**
		 * Global keyboard handler for slide navigation (Home/End/Arrows).
		 *
		 * @param event - Keyboard event to inspect for navigation keys
		 * @returns void
		 */
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

	// When in full-screen mode, listen for Escape to exit. Listener is
	// removed on unmount or when `isFullScreen` changes.
	useEffect(() => {
		if (!isFullScreen) {
			return;
		}
		/**
		 * Escape key handler to exit full-screen mode when active.
		 *
		 * @param event - Keyboard event to inspect for Escape
		 * @returns void
		 */
		function onKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				setIsFullScreen(false);
			}
		}
		globalThis.addEventListener("keydown", onKeyDown);
		return function cleanup(): void {
			globalThis.removeEventListener("keydown", onKeyDown);
		};
	}, [isFullScreen]);

	// Keep the full-screen slide sized against the current viewport ratio.
	useEffect(() => {
		if (!isFullScreen) {
			return;
		}

		/**
		 * Resize handler to refresh the stored viewport aspect ratio.
		 *
		 * @returns void
		 */
		function handleResize(): void {
			setViewportAspectRatio(getViewportAspectRatio());
		}

		handleResize();
		globalThis.addEventListener("resize", handleResize);
		return function cleanup(): void {
			globalThis.removeEventListener("resize", handleResize);
		};
	}, [isFullScreen]);

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
	 * Derive which fields to display from the song's language pickers.
	 * `lyrics` is always present; `script` and `translations` are optional.
	 */
	const displayFields: readonly string[] =
		songPublic === undefined
			? []
			: [
					songPublic.lyrics,
					...(songPublic.script === undefined || songPublic.script === null
						? []
						: [songPublic.script]),
					...songPublic.translations,
				];

	return {
		canPortalFullScreen,
		clampedIndex,
		currentSlide,
		displayFields,
		effectiveSlideOrientation,
		goFirst,
		goLast,
		goNext,
		goPrev,
		isFullScreen,
		setIsFullScreen,
		slideContainerClassName,
		totalSlides,
		viewportAspectRatio,
	};
}
