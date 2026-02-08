import type { PlacementConfig, PopoverPosition } from "../popover-types";

import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";

/**
 * Adjusts position for top/bottom placements to fit within viewport
 *
 * @param args - placement, position, popover and viewport sizes
 * @returns adjusted PopoverPosition
 */
export default function adjustTopBottomPosition({
	placement,
	position,
	popoverWidth,
	popoverHeight,
	viewportWidth,
	viewportHeight,
}: {
	readonly placement: PlacementConfig;
	readonly position: PopoverPosition;
	readonly popoverWidth: number;
	readonly popoverHeight: number;
	readonly viewportWidth: number;
	readonly viewportHeight: number;
}): PopoverPosition {
	let adjustedPosition = { ...position };

	// Adjust horizontal position
	if (adjustedPosition.left !== undefined) {
		let minLeft: number = MIN_MARGIN;
		let maxLeft: number = viewportWidth - popoverWidth - MIN_MARGIN;
		if (adjustedPosition.transform === "translateX(-50%)") {
			const halfWidth = popoverWidth / CENTER_DIVISOR;
			minLeft = halfWidth + MIN_MARGIN;
			maxLeft = viewportWidth - halfWidth - MIN_MARGIN;
		} else {
			minLeft = MIN_MARGIN;
			maxLeft = viewportWidth - popoverWidth - MIN_MARGIN;
		}
		adjustedPosition = {
			...adjustedPosition,
			left: Math.max(minLeft, Math.min(maxLeft, adjustedPosition.left)),
		};
	}

	// Adjust vertical position if still overflowing
	if (placement.name === "bottom" && adjustedPosition.top !== undefined) {
		const maxTop = viewportHeight - popoverHeight - MIN_MARGIN;
		adjustedPosition = {
			...adjustedPosition,
			top: Math.min(adjustedPosition.top, maxTop),
		};
	} else if (placement.name === "top" && adjustedPosition.top !== undefined) {
		adjustedPosition = {
			...adjustedPosition,
			top: Math.max(MIN_MARGIN, adjustedPosition.top),
		};
	}

	return adjustedPosition;
}
