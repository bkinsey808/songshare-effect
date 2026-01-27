import { useEffect, useState } from "react";

import { SCROLL_THRESHOLD } from "@/shared/constants/http";

/**
 * Hook that tracks whether the page has been scrolled past a threshold.
 * Used to compress the navigation header when scrolled.
 */
export default function useIsScrolled(): boolean {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
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
