import { POPOVER_DEFAULT_HEIGHT, POPOVER_DEFAULT_WIDTH } from "@/shared/constants/http";

import type { PlacementOption, PopoverPosition } from "./types";

import calculatePopoverPosition from "./calculatePopoverPosition";

/**
 * Calculate the popover coordinates and update state.
 *
 * Computes the preferred placement and pixel coordinates for the popover
 * using the trigger and popover bounding rectangles. If both elements are
 * available the computed `PopoverPosition` and resolved `PlacementOption`
 * are applied via the provided setters.
 *
 * @param triggerRef - Ref to the trigger element (may be `null`)
 * @param popoverRef - Ref to the popover element (may be `null`)
 * @param preferredPlacement - Preferred placement hint (e.g., "top" | "bottom")
 * @param setPopoverPosition - Setter to apply the calculated `PopoverPosition`
 * @param setPlacement - Setter to apply the resolved `PlacementOption`
 * @returns void
 */
export default function calculateAndUpdatePosition({
	triggerRef,
	popoverRef,
	preferredPlacement,
	setPopoverPosition,
	setPlacement,
}: Readonly<{
	triggerRef: React.RefObject<HTMLElement | null>;
	popoverRef: React.RefObject<HTMLDivElement | null>;
	preferredPlacement: PlacementOption;
	setPopoverPosition: (position: PopoverPosition) => void;
	setPlacement: (placement: PlacementOption) => void;
}>): void {
	if (triggerRef.current !== null && popoverRef.current !== null) {
		const triggerRect = triggerRef.current.getBoundingClientRect();
		const popoverRect = popoverRef.current.getBoundingClientRect();

		const { position, placement: calculatedPlacement } = calculatePopoverPosition({
			triggerRect,
			popoverWidth: popoverRect.width || POPOVER_DEFAULT_WIDTH,
			popoverHeight: popoverRect.height || POPOVER_DEFAULT_HEIGHT,
			preferredPlacement,
		});

		setPopoverPosition(position);
		setPlacement(calculatedPlacement);
	}
}
