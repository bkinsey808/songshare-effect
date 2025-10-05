import type { PlacementOption, PopoverPosition } from "./types";

type PlacementConfig = {
	name: PlacementOption;
	hasSpace: boolean;
	position: PopoverPosition;
};

/**
 * Calculates optimal popover position relative to trigger element
 * Uses smart fallback algorithm when preferred placement doesn't fit
 */
export default function calculatePopoverPosition(
	triggerRect: DOMRect,
	popoverWidth: number,
	popoverHeight: number,
	preferredPlacement: PlacementOption = "bottom",
	gap = 8,
): { position: PopoverPosition; placement: PlacementOption } {
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
	const preferredOption = placements.find((p) => p.name === preferredPlacement);
	if (preferredOption?.hasSpace === true) {
		const position = { ...preferredOption.position };

		// Ensure horizontal centering doesn't push popover outside viewport
		if (
			position.transform === "translateX(-50%)" &&
			position.left !== undefined
		) {
			const halfWidth = popoverWidth / 2;
			const minLeft = halfWidth + 8;
			const maxLeft = viewportWidth - halfWidth - 8;
			position.left = Math.max(minLeft, Math.min(maxLeft, position.left));
		}

		return { position, placement: preferredOption.name };
	}

	// Fallback to any placement with enough space
	const availableOption = placements.find((p) => p.hasSpace);
	if (availableOption) {
		const position = { ...availableOption.position };

		// Ensure horizontal centering doesn't push popover outside viewport
		if (
			position.transform === "translateX(-50%)" &&
			position.left !== undefined
		) {
			const halfWidth = popoverWidth / 2;
			const minLeft = halfWidth + 8;
			const maxLeft = viewportWidth - halfWidth - 8;
			position.left = Math.max(minLeft, Math.min(maxLeft, position.left));
		}

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
	});

	let position = { ...bestFitPlacement.position };

	// Adjust position to fit within viewport bounds
	if (bestFitPlacement.name === "top" || bestFitPlacement.name === "bottom") {
		// For top/bottom placements, adjust horizontal position
		if (position.left !== undefined) {
			if (position.transform === "translateX(-50%)") {
				const halfWidth = popoverWidth / 2;
				const minLeft = halfWidth + 8;
				const maxLeft = viewportWidth - halfWidth - 8;
				position = {
					...position,
					left: Math.max(minLeft, Math.min(maxLeft, position.left)),
				};
			} else {
				const minLeft = 8;
				const maxLeft = viewportWidth - popoverWidth - 8;
				position = {
					...position,
					left: Math.max(minLeft, Math.min(maxLeft, position.left)),
				};
			}
		}

		// Adjust vertical position if still overflowing
		if (bestFitPlacement.name === "bottom" && position.top !== undefined) {
			const maxTop = viewportHeight - popoverHeight - 8;
			position = {
				...position,
				top: Math.min(position.top, maxTop),
			};
		} else if (bestFitPlacement.name === "top" && position.top !== undefined) {
			position = {
				...position,
				top: Math.max(8, position.top),
			};
		}
	} else {
		// For left/right placements, adjust vertical position
		if (position.top !== undefined) {
			if (position.transform === "translateY(-50%)") {
				const halfHeight = popoverHeight / 2;
				const minTop = halfHeight + 8;
				const maxTop = viewportHeight - halfHeight - 8;
				position = {
					...position,
					top: Math.max(minTop, Math.min(maxTop, position.top)),
				};
			} else {
				const minTop = 8;
				const maxTop = viewportHeight - popoverHeight - 8;
				position = {
					...position,
					top: Math.max(minTop, Math.min(maxTop, position.top)),
				};
			}
		}

		// Adjust horizontal position if still overflowing
		if (bestFitPlacement.name === "right" && position.left !== undefined) {
			const maxLeft = viewportWidth - popoverWidth - 8;
			position = {
				...position,
				left: Math.min(position.left, maxLeft),
			};
		} else if (
			bestFitPlacement.name === "left" &&
			position.left !== undefined
		) {
			position = {
				...position,
				left: Math.max(8, position.left),
			};
		}
	}

	return {
		position,
		placement: bestFitPlacement.name,
	};
}
