import {
    ResolvedSlideOrientation,
    type ResolvedSlideOrientationType,
} from "@/shared/user/slideOrientationPreference";

/**
 * Detect system orientation via `matchMedia` and return the resolved orientation.
 *
 * @returns ResolvedSlideOrientationType for current system orientation
 */
export default function getSystemSlideOrientation(): ResolvedSlideOrientationType {
	if (typeof globalThis === "undefined" || typeof globalThis.matchMedia !== "function") {
		return ResolvedSlideOrientation.landscape;
	}

	return globalThis.matchMedia("(orientation: portrait)").matches
		? ResolvedSlideOrientation.portrait
		: ResolvedSlideOrientation.landscape;
}
