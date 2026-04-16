import { useEffect, useState } from "react";

import type { ResolvedSlideOrientationType } from "@/shared/user/slideOrientationPreference";

import getSystemSlideOrientation from "./getSystemSlideOrientation";

/**
 * Hook that resolves the current system slide orientation based on the
 * viewport orientation media query.
 *
 * @returns "portrait" or "landscape" indicating the resolved system orientation
 */
export default function useSystemSlideOrientation(): ResolvedSlideOrientationType {
	const [systemSlideOrientation, setSystemSlideOrientation] = useState(getSystemSlideOrientation);

	// Keep the resolved "system" orientation in sync with viewport changes.
	useEffect(() => {
		if (typeof globalThis === "undefined" || typeof globalThis.matchMedia !== "function") {
			return;
		}

		const mediaQuery = globalThis.matchMedia("(orientation: portrait)");

		/**
		 * Update the state with the current system slide orientation.
		 *
		 * @returns void
		 */
		function handleChange(): void {
			setSystemSlideOrientation(getSystemSlideOrientation());
		}

		handleChange();
		mediaQuery.addEventListener("change", handleChange);

		return (): void => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, []);

	return systemSlideOrientation;
}
