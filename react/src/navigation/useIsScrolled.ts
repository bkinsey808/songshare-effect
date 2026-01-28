import { useEffect, useState } from "react";

import { SCROLL_THRESHOLD } from "@/shared/constants/http";

/**
 * Hook that tracks whether the page has been scrolled past a threshold.
 * Used to compress the navigation header when scrolled.
 *
 * Notes:
 * - Uses `globalThis` so the hook can be referenced in environments where
 *   `window` may be undefined (e.g., SSR or test environments).
 * - Threshold value (in pixels) is defined by `SCROLL_THRESHOLD`.
 *
 * @returns true when the page vertical scroll (`scrollY`) is greater than `SCROLL_THRESHOLD`
 */
export default function useIsScrolled(): boolean {
	// Start `false` to avoid an initial compressed header flash before the user scrolls.
	const [isScrolled, setIsScrolled] = useState(false);

	// Attach a scroll listener on mount and remove it on unmount.
	// The empty dependency array ensures the listener is added only once.
	useEffect(() => {
		/**
		 * Read the global vertical scroll position and update state when crossing
		 * the `SCROLL_THRESHOLD`.
		 */
		function handleScroll(): void {
			const scrollTop = globalThis.scrollY;
			setIsScrolled(scrollTop > SCROLL_THRESHOLD);
		}

		globalThis.addEventListener("scroll", handleScroll);
		return (): void => {
			globalThis.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return isScrolled;
}
