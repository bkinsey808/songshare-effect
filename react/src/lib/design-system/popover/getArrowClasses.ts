import tw from "@/react/lib/utils/tw";

import { type PlacementOption } from "./popover-types";

/**
 * Returns Tailwind CSS classes for positioning the popover arrow
 * based on the calculated placement
 *
 * @returns Tailwind CSS classes used for positioning the arrow
 */
export default function getArrowClasses(placement: PlacementOption): string {
	switch (placement) {
		case "bottom": {
			return tw`-top-1 left-1/2 -translate-x-1/2`;
		}
		case "top": {
			return tw`-bottom-1 left-1/2 -translate-x-1/2`;
		}
		case "right": {
			return tw`top-1/2 -left-1 -translate-y-1/2`;
		}
		case "left": {
			return tw`top-1/2 -right-1 -translate-y-1/2`;
		} // Switch is exhaustive for `PlacementOption`; no default needed
	}
}
