import { useEffect, useState } from "react";

import { ZERO } from "@/shared/constants/shared-constants";

import calculateAndUpdatePosition from "./calculateAndUpdatePosition";
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
 * Custom hook that manages popover positioning and scroll/resize tracking.
 *
 * The hook automatically computes and maintains the popover coordinates
 * and the placement used, keeping the popover positioned relative to the
 * `triggerRef` element. It also listens for scroll and resize events and
 * will call `hidePopover` when the trigger moves completely off-screen.
 *
 * @param triggerRef - Ref to the trigger element that the popover is anchored to
 * @param popoverRef - Ref to the popover element that will be positioned
 * @param preferredPlacement - Preferred placement hint (e.g., "top" | "bottom")
 * @param hidePopover - Callback invoked to hide/close the popover
 * @returns popoverPosition - Computed style object (top/left) used to position the popover
 * @returns placement - Resolved `PlacementOption` actually used for layout
 * @returns updatePosition - Helper function to manually recompute position
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

	/**
	 * Recompute and apply the popover position on demand.
	 *
	 * @returns void
	 */
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
