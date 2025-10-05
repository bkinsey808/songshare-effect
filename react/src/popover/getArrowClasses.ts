import type { PlacementOption } from "./types";

/**
 * Returns Tailwind CSS classes for positioning the popover arrow
 * based on the calculated placement
 */
export function getArrowClasses(placement: PlacementOption): string {
	switch (placement) {
		case "bottom":
			return "-top-1 left-1/2 -translate-x-1/2";
		case "top":
			return "-bottom-1 left-1/2 -translate-x-1/2";
		case "right":
			return "top-1/2 -left-1 -translate-y-1/2";
		case "left":
			return "top-1/2 -right-1 -translate-y-1/2";
		default:
			return "-top-1 left-1/2 -translate-x-1/2";
	}
}
