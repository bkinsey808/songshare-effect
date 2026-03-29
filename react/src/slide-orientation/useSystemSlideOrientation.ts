import { useEffect, useState } from "react";

import type { ResolvedSlideOrientationType } from "@/shared/user/slideOrientationPreference";

import getSystemSlideOrientation from "./getSystemSlideOrientation";

export default function useSystemSlideOrientation(): ResolvedSlideOrientationType {
	const [systemSlideOrientation, setSystemSlideOrientation] = useState(getSystemSlideOrientation);

	// Keep the resolved "system" orientation in sync with viewport changes.
	useEffect(() => {
		if (typeof globalThis === "undefined" || typeof globalThis.matchMedia !== "function") {
			return;
		}

		const mediaQuery = globalThis.matchMedia("(orientation: portrait)");

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
