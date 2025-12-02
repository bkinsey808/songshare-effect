import { useEffect, useState } from "react";

import { POPOVER_DEFAULT_WIDTH, POPOVER_DEFAULT_HEIGHT } from "@/shared/constants/http";

import calculatePopoverPosition from "./calculatePopoverPosition";
import { type PlacementOption, type PopoverPosition } from "./types";

type UsePopoverPositioningParams = Readonly<{
	triggerRef: React.RefObject<HTMLElement | null>;
	popoverRef: React.RefObject<HTMLDivElement | null>;
	preferredPlacement: PlacementOption;
	hidePopover: () => void;
}>;

type UsePopoverPositioningReturn = {
	popoverPosition: PopoverPosition;
	placement: PlacementOption;
	updatePosition: () => void;
};

/**
 * Shared position calculation logic
 */
function calculateAndUpdatePosition({
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

/**
 * Custom hook to handle popover positioning and scroll tracking
 * Automatically positions popover relative to trigger and handles scroll events
 */
export default function usePopoverPositioning({
	triggerRef,
	popoverRef,
	preferredPlacement,
	hidePopover,
}: UsePopoverPositioningParams): UsePopoverPositioningReturn {
	const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({});
	const [placement, setPlacement] = useState<PlacementOption>("bottom");

	// File-level/local constants to avoid magic numbers
	const ZERO = 0;

	// Handle scroll events to keep popover positioned relative to trigger
	useEffect(() => {
		let rafId: number | undefined = undefined;

		function handleScrollAndResize(): void {
			// Use requestAnimationFrame to throttle updates
			if (rafId !== undefined) {
				return;
			}

			rafId = requestAnimationFrame((): void => {
				rafId = undefined;
				const popover = popoverRef.current;
				const triggerElement = triggerRef.current;

				if (
					popover !== null &&
					triggerElement !== null &&
					"matches" in popover &&
					typeof popover.matches === "function" &&
					popover.matches(":popover-open")
				) {
					// Check if trigger element is still visible in viewport
					const triggerRect = triggerElement.getBoundingClientRect();
					const viewportHeight = globalThis.innerHeight;
					const viewportWidth = globalThis.innerWidth;

					// Close popover if trigger is completely off-screen
					const isOffScreen =
						triggerRect.bottom < ZERO ||
						triggerRect.top > viewportHeight ||
						triggerRect.right < ZERO ||
						triggerRect.left > viewportWidth;

					if (isOffScreen) {
						hidePopover();
					} else {
						calculateAndUpdatePosition({
							triggerRef,
							popoverRef,
							preferredPlacement,
							setPopoverPosition,
							setPlacement,
						});
					}
				}
			});
		}

		// Add event listeners for scroll and resize
		globalThis.addEventListener("scroll", handleScrollAndResize, {
			passive: true,
		});
		globalThis.addEventListener("resize", handleScrollAndResize, {
			passive: true,
		});
		document.addEventListener("scroll", handleScrollAndResize, {
			passive: true,
		});

		// Cleanup event listeners and cancel pending animation frame
		return (): void => {
			if (rafId !== undefined) {
				cancelAnimationFrame(rafId);
			}
			globalThis.removeEventListener("scroll", handleScrollAndResize);
			globalThis.removeEventListener("resize", handleScrollAndResize);
			document.removeEventListener("scroll", handleScrollAndResize);
		};
	}, [hidePopover, popoverRef, triggerRef, preferredPlacement]);

	// Public API function for external position updates
	function updatePosition(): void {
		calculateAndUpdatePosition({
			triggerRef,
			popoverRef,
			preferredPlacement,
			setPopoverPosition,
			setPlacement,
		});
	}

	return { popoverPosition, placement, updatePosition };
}
