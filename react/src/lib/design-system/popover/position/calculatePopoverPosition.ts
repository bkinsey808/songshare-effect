import { type ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

import type { PlacementConfig, PlacementOption, PopoverPosition } from "../popover-types";

import { CENTER_DIVISOR, GAP_DEFAULT } from "../popover-constants";
import adjustHorizontalPosition from "./adjustHorizontalPosition";
import adjustLeftRightPosition from "./adjustLeftRightPosition";
import adjustTopBottomPosition from "./adjustTopBottomPosition";

/**
 * Calculates optimal popover position relative to trigger element
 * Uses smart fallback algorithm when preferred placement doesn't fit
 *
 * @returns An object with `position` (style object for popover) and `placement` (chosen placement)
 */
export default function calculatePopoverPosition({
	triggerRect,
	popoverWidth,
	popoverHeight,
	preferredPlacement = "bottom",
	gap = GAP_DEFAULT,
}: ReadonlyDeep<{
	readonly triggerRect: DOMRect;
	readonly popoverWidth: number;
	readonly popoverHeight: number;
	readonly preferredPlacement?: PlacementOption;
	readonly gap?: number;
}>): { position: PopoverPosition; placement: PlacementOption } {
	const viewportWidth = globalThis.innerWidth;
	const viewportHeight = globalThis.innerHeight;

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
				left: triggerRect.left + triggerRect.width / CENTER_DIVISOR,
				transform: "translateX(-50%)",
			},
		},
		{
			name: "top",
			hasSpace: spaceAbove >= popoverHeight + gap,
			position: {
				top: triggerRect.top - popoverHeight - gap,
				left: triggerRect.left + triggerRect.width / CENTER_DIVISOR,
				transform: "translateX(-50%)",
			},
		},
		{
			name: "right",
			hasSpace: spaceRight >= popoverWidth + gap,
			position: {
				top: triggerRect.top + triggerRect.height / CENTER_DIVISOR,
				left: triggerRect.right + gap,
				transform: "translateY(-50%)",
			},
		},
		{
			name: "left",
			hasSpace: spaceLeft >= popoverWidth + gap,
			position: {
				top: triggerRect.top + triggerRect.height / CENTER_DIVISOR,
				left: triggerRect.left - popoverWidth - gap,
				transform: "translateY(-50%)",
			},
		},
	];

	// Try preferred placement first
	const preferredOption = placements.find((pl) => pl.name === preferredPlacement);
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

	const [firstPlacement, ...restPlacements] = placements;
	if (firstPlacement === undefined) {
		throw new Error("No placements available");
	}
	let bestFitPlacement: PlacementConfig = firstPlacement;

	for (const current of restPlacements) {
		let currentSpace = 0;
		if (current.name === "top" || current.name === "bottom") {
			currentSpace = current.name === "top" ? spaceAbove : spaceBelow;
		} else {
			currentSpace = current.name === "left" ? spaceLeft : spaceRight;
		}

		let bestSpace = 0;
		if (bestFitPlacement.name === "top" || bestFitPlacement.name === "bottom") {
			bestSpace = bestFitPlacement.name === "top" ? spaceAbove : spaceBelow;
		} else {
			bestSpace = bestFitPlacement.name === "left" ? spaceLeft : spaceRight;
		}

		if (currentSpace > bestSpace) {
			bestFitPlacement = current;
		}
	}

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
