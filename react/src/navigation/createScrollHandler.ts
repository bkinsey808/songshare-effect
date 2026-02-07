import type { RefObject } from "react";

import { SCROLL_HYSTERESIS, SCROLL_THRESHOLD } from "./navigation-constants";

/**
 * Creates a scroll event handler with hysteresis to prevent feedback loops.
 *
 * The handler uses requestAnimationFrame throttling and different thresholds
 * for scrolling down vs up to prevent rapid state changes when header size
 * changes affect scroll position.
 *
 * @param isScrolledRef - Ref tracking current scroll state
 * @param setIsScrolled - State setter for scroll state
 * @returns Object with handleScroll function and cleanup function
 */
export default function createScrollHandler(
	isScrolledRef: RefObject<boolean>,
	setIsScrolled: (value: boolean) => void,
): { handleScroll: () => void; cleanup: () => void } {
	let rafId: number | undefined = undefined;

	/**
	 * Read the global vertical scroll position and update state when crossing
	 * the threshold with hysteresis.
	 * Throttled using requestAnimationFrame to smooth out rapid scroll events.
	 */
	function handleScroll(): void {
		// Skip if a frame is already scheduled
		if (rafId !== undefined) {
			return;
		}

		rafId = requestAnimationFrame(() => {
			rafId = undefined;
			const scrollTop = globalThis.scrollY;
			// Use hysteresis: different thresholds for scrolling down vs up
			if (!isScrolledRef.current && scrollTop > SCROLL_THRESHOLD) {
				// Scrolling down: become scrolled when passing upper threshold
				setIsScrolled(true);
			} else if (isScrolledRef.current && scrollTop < SCROLL_THRESHOLD - SCROLL_HYSTERESIS) {
				// Scrolling up: become unscrolled when passing lower threshold
				setIsScrolled(false);
			}
		});
	}

	/**
	 * Cancel any pending requestAnimationFrame.
	 */
	function cleanup(): void {
		if (rafId !== undefined) {
			cancelAnimationFrame(rafId);
		}
	}

	return { handleScroll, cleanup };
}
