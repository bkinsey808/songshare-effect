import {
	ResolvedSlideOrientation,
	type ResolvedSlideOrientationType,
} from "@/shared/user/slideOrientationPreference";

export default function getSystemSlideOrientation(): ResolvedSlideOrientationType {
	if (typeof globalThis === "undefined" || typeof globalThis.matchMedia !== "function") {
		return ResolvedSlideOrientation.landscape;
	}

	return globalThis.matchMedia("(orientation: portrait)").matches
		? ResolvedSlideOrientation.portrait
		: ResolvedSlideOrientation.landscape;
}
