import { useEffect, useRef, useState } from "react";

import createScrollHandler from "./createScrollHandler";

/**
 * Hook that tracks whether the page has been scrolled past a threshold.
 * Used to compress the navigation header when scrolled.
 *
 * Uses hysteresis to prevent feedback loops when header resize causes content shifts:
 * - Becomes true when scrolling down past SCROLL_THRESHOLD
 * - Becomes false when scrolling up below (SCROLL_THRESHOLD - SCROLL_HYSTERESIS)
 *
 * Notes:
 * - Uses `globalThis` so the hook can be referenced in environments where
 *   `window` may be undefined (e.g., SSR or test environments).
 * - Threshold values (in pixels) are defined by `SCROLL_THRESHOLD` and `SCROLL_HYSTERESIS`.
 *
 * @returns true when the page vertical scroll (`scrollY`) is in the scrolled state
 */
export default function useIsScrolled(): boolean {
	// Start `false` to avoid an initial compressed header flash before the user scrolls.
	const [isScrolled, setIsScrolled] = useState(false);
	// Use ref to track current state without causing effect to re-run
	const isScrolledRef = useRef(isScrolled);

	// Keep ref in sync with state
	useEffect(() => {
		isScrolledRef.current = isScrolled;
	}, [isScrolled]);

	// Attach a scroll listener on mount and remove it on unmount.
	// The empty dependency array ensures the listener is added only once.
	useEffect(() => {
		const { handleScroll, cleanup } = createScrollHandler(isScrolledRef, setIsScrolled);

		globalThis.addEventListener("scroll", handleScroll, { passive: true });
		return (): void => {
			cleanup();
			globalThis.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return isScrolled;
}
