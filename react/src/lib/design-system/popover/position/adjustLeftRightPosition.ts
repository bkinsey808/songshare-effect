import type { PlacementConfig, PopoverPosition } from "../popover-types";

import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";

/**
 * Adjusts position for left/right placements to fit within viewport
 *
 * @param args - placement, position, popover and viewport sizes
 * @returns adjusted PopoverPosition
 */
export default function adjustLeftRightPosition({
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

	// Adjust vertical position
	if (adjustedPosition.top !== undefined) {
		let minTop: number = MIN_MARGIN;
		let maxTop: number = viewportHeight - popoverHeight - MIN_MARGIN;
		if (adjustedPosition.transform === "translateY(-50%)") {
			const halfHeight = popoverHeight / CENTER_DIVISOR;
			minTop = halfHeight + MIN_MARGIN;
			maxTop = viewportHeight - halfHeight - MIN_MARGIN;
		} else {
			minTop = MIN_MARGIN;
			maxTop = viewportHeight - popoverHeight - MIN_MARGIN;
		}
		adjustedPosition = {
			...adjustedPosition,
			top: Math.max(minTop, Math.min(maxTop, adjustedPosition.top)),
		};
	}

	// Adjust horizontal position if still overflowing
	if (placement.name === "right" && adjustedPosition.left !== undefined) {
		const maxLeft = viewportWidth - popoverWidth - MIN_MARGIN;
		adjustedPosition = {
			...adjustedPosition,
			left: Math.min(adjustedPosition.left, maxLeft),
		};
	} else if (placement.name === "left" && adjustedPosition.left !== undefined) {
		adjustedPosition = {
			...adjustedPosition,
			left: Math.max(MIN_MARGIN, adjustedPosition.left),
		};
	}

	return adjustedPosition;
}
