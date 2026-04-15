import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";
import type { PlacementConfig, PopoverPosition } from "../popover-types";

/**
 * Adjusts position for top/bottom placements to fit within viewport
 *
 * @param placement - Placement configuration used to choose top/bottom adjustments
 * @param position - Initial computed popover position
 * @param popoverWidth - Width of the popover in pixels
 * @param popoverHeight - Height of the popover in pixels
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
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
