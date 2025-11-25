import type { ReadonlyDeep } from "@/shared/types/deep-readonly";

import type { PlacementOption, PopoverPosition } from "./types";

type PlacementConfig = {
	readonly name: PlacementOption;
	readonly hasSpace: boolean;
	readonly position: PopoverPosition;
};

/**
 * Ensures horizontal centering doesn't push popover outside viewport
 */
function adjustHorizontalPosition({
	position,
	popoverWidth,
	viewportWidth,
}: {
	readonly position: PopoverPosition;
	readonly popoverWidth: number;
	readonly viewportWidth: number;
}): PopoverPosition {
	if (
		position.transform === "translateX(-50%)" &&
		position.left !== undefined
	) {
		const halfWidth = popoverWidth / 2;
		const minLeft = halfWidth + 8;
		const maxLeft = viewportWidth - halfWidth - 8;
		return {
			...position,
			left: Math.max(minLeft, Math.min(maxLeft, position.left)),
		};
	}
	return position;
}

/**
 * Adjusts position for top/bottom placements to fit within viewport
 */
function adjustTopBottomPosition({
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
		if (adjustedPosition.transform === "translateX(-50%)") {
			const halfWidth = popoverWidth / 2;
			const minLeft = halfWidth + 8;
			const maxLeft = viewportWidth - halfWidth - 8;
			adjustedPosition = {
				...adjustedPosition,
				left: Math.max(minLeft, Math.min(maxLeft, adjustedPosition.left)),
			};
		} else {
			const minLeft = 8;
			const maxLeft = viewportWidth - popoverWidth - 8;
			adjustedPosition = {
				...adjustedPosition,
				left: Math.max(minLeft, Math.min(maxLeft, adjustedPosition.left)),
			};
		}
	}

	// Adjust vertical position if still overflowing
	if (placement.name === "bottom" && adjustedPosition.top !== undefined) {
		const maxTop = viewportHeight - popoverHeight - 8;
		adjustedPosition = {
			...adjustedPosition,
			top: Math.min(adjustedPosition.top, maxTop),
		};
	} else if (placement.name === "top" && adjustedPosition.top !== undefined) {
		adjustedPosition = {
			...adjustedPosition,
			top: Math.max(8, adjustedPosition.top),
		};
	}

	return adjustedPosition;
}

/**
 * Adjusts position for left/right placements to fit within viewport
 */
function adjustLeftRightPosition({
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
		if (adjustedPosition.transform === "translateY(-50%)") {
			const halfHeight = popoverHeight / 2;
			const minTop = halfHeight + 8;
			const maxTop = viewportHeight - halfHeight - 8;
			adjustedPosition = {
				...adjustedPosition,
				top: Math.max(minTop, Math.min(maxTop, adjustedPosition.top)),
			};
		} else {
			const minTop = 8;
			const maxTop = viewportHeight - popoverHeight - 8;
			adjustedPosition = {
				...adjustedPosition,
				top: Math.max(minTop, Math.min(maxTop, adjustedPosition.top)),
			};
		}
	}

	// Adjust horizontal position if still overflowing
	if (placement.name === "right" && adjustedPosition.left !== undefined) {
		const maxLeft = viewportWidth - popoverWidth - 8;
		adjustedPosition = {
			...adjustedPosition,
			left: Math.min(adjustedPosition.left, maxLeft),
		};
	} else if (placement.name === "left" && adjustedPosition.left !== undefined) {
		adjustedPosition = {
			...adjustedPosition,
			left: Math.max(8, adjustedPosition.left),
		};
	}

	return adjustedPosition;
}

/**
 * Calculates optimal popover position relative to trigger element
 * Uses smart fallback algorithm when preferred placement doesn't fit
 */
export default function calculatePopoverPosition({
	triggerRect,
	popoverWidth,
	popoverHeight,
	preferredPlacement = "bottom",
	gap = 8,
}: ReadonlyDeep<{
	readonly triggerRect: DOMRect;
	readonly popoverWidth: number;
	readonly popoverHeight: number;
	readonly preferredPlacement?: PlacementOption;
	readonly gap?: number;
}>): { position: PopoverPosition; placement: PlacementOption } {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	// Calculate available space in each direction from the viewport edge
	const spaceAbove = triggerRect.top;
	const spaceBelow = viewportHeight - triggerRect.bottom;
	const spaceLeft = triggerRect.left;
	const spaceRight = viewportWidth - triggerRect.right;

	// Define all possible placements with their space requirements and positioning
	const placements: PlacementConfig[] = [
		{
			name: "bottom",
			hasSpace: spaceBelow >= popoverHeight + gap,
			position: {
				top: triggerRect.bottom + gap,
				left: triggerRect.left + triggerRect.width / 2,
				transform: "translateX(-50%)",
			},
		},
		{
			name: "top",
			hasSpace: spaceAbove >= popoverHeight + gap,
			position: {
				top: triggerRect.top - popoverHeight - gap,
				left: triggerRect.left + triggerRect.width / 2,
				transform: "translateX(-50%)",
			},
		},
		{
			name: "right",
			hasSpace: spaceRight >= popoverWidth + gap,
			position: {
				top: triggerRect.top + triggerRect.height / 2,
				left: triggerRect.right + gap,
				transform: "translateY(-50%)",
			},
		},
		{
			name: "left",
			hasSpace: spaceLeft >= popoverWidth + gap,
			position: {
				top: triggerRect.top + triggerRect.height / 2,
				left: triggerRect.left - popoverWidth - gap,
				transform: "translateY(-50%)",
			},
		},
	];

	// Try preferred placement first
	const preferredOption = placements.find(
		(pl) => pl.name === preferredPlacement,
	);
	if (preferredOption?.hasSpace === true) {
		const position = adjustHorizontalPosition({
			position: preferredOption.position,
			popoverWidth,
			viewportWidth,
		});

		return { position, placement: preferredOption.name };
	}

	// Fallback to any placement with enough space
	const availableOption = placements.find((pl) => pl.hasSpace);
	if (availableOption) {
		const position = adjustHorizontalPosition({
			position: availableOption.position,
			popoverWidth,
			viewportWidth,
		});

		return { position, placement: availableOption.name };
	}

	// If no space available, use the placement with the most space
	const bestFitPlacement = placements.reduce((best, current) => {
		let currentSpace: number;
		if (current.name === "top" || current.name === "bottom") {
			currentSpace = current.name === "top" ? spaceAbove : spaceBelow;
		} else {
			currentSpace = current.name === "left" ? spaceLeft : spaceRight;
		}

		let bestSpace: number;
		if (best.name === "top" || best.name === "bottom") {
			bestSpace = best.name === "top" ? spaceAbove : spaceBelow;
		} else {
			bestSpace = best.name === "left" ? spaceLeft : spaceRight;
		}

		return currentSpace > bestSpace ? current : best;
	}, placements[0]!);

	let position = { ...bestFitPlacement.position };

	// Adjust position to fit within viewport bounds
	if (bestFitPlacement.name === "top" || bestFitPlacement.name === "bottom") {
		position = adjustTopBottomPosition({
			placement: bestFitPlacement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});
	} else {
		position = adjustLeftRightPosition({
			placement: bestFitPlacement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});
	}

	return {
		position,
		placement: bestFitPlacement.name,
	};
}
