import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";
import { type PopoverPosition } from "../popover-types";

/**
 * Ensures horizontal centering doesn't push popover outside viewport
 *
 * @param args - configuration for adjustment
 * @returns adjusted PopoverPosition
 */
export default function adjustHorizontalPosition({
	position,
	popoverWidth,
	viewportWidth,
}: {
	readonly position: PopoverPosition;
	readonly popoverWidth: number;
	readonly viewportWidth: number;
}): PopoverPosition {
	if (position.transform === "translateX(-50%)" && position.left !== undefined) {
		const halfWidth = popoverWidth / CENTER_DIVISOR;
		const minLeft = halfWidth + MIN_MARGIN;
		const maxLeft = viewportWidth - halfWidth - MIN_MARGIN;
		return {
			...position,
			left: Math.max(minLeft, Math.min(maxLeft, position.left)),
		};
	}
	return position;
}
