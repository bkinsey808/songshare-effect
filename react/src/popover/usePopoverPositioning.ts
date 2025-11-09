import { useCallback, useEffect, useState } from "react";

import calculatePopoverPosition from "./calculatePopoverPosition";
import type { PlacementOption, PopoverPosition } from "./types";

type UsePopoverPositioningParams = Readonly<{
	triggerRef: React.RefObject<HTMLDivElement | null>;
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
 * Custom hook to handle popover positioning and scroll tracking
 * Automatically positions popover relative to trigger and handles scroll events
 */
export function usePopoverPositioning({
	triggerRef,
	popoverRef,
	preferredPlacement,
	hidePopover,
}: UsePopoverPositioningParams): UsePopoverPositioningReturn {
	const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({});
	const [placement, setPlacement] = useState<PlacementOption>("bottom");

	// Common position update logic
	const updatePosition = useCallback((): void => {
		if (triggerRef.current !== null && popoverRef.current !== null) {
			const triggerRect = triggerRef.current.getBoundingClientRect();
			const popoverRect = popoverRef.current.getBoundingClientRect();

			const { position, placement: calculatedPlacement } =
				calculatePopoverPosition({
					triggerRect,
					popoverWidth: popoverRect.width || 256,
					popoverHeight: popoverRect.height || 200,
					preferredPlacement,
				});

			setPopoverPosition(position);
			setPlacement(calculatedPlacement);
		}
	}, [triggerRef, popoverRef, preferredPlacement]);

	// Handle scroll events to keep popover positioned relative to trigger
	useEffect(() => {
		let rafId: number | undefined;

		const handleScrollAndResize = (): void => {
			// Use requestAnimationFrame to throttle updates
			if (rafId !== undefined) {
				return;
			}

			rafId = requestAnimationFrame(() => {
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
					const viewportHeight = window.innerHeight;
					const viewportWidth = window.innerWidth;

					// Close popover if trigger is completely off-screen
					const isOffScreen =
						triggerRect.bottom < 0 ||
						triggerRect.top > viewportHeight ||
						triggerRect.right < 0 ||
						triggerRect.left > viewportWidth;

					if (isOffScreen) {
						hidePopover();
					} else {
						updatePosition();
					}
				}
			});
		};

		// Add event listeners for scroll and resize
		window.addEventListener("scroll", handleScrollAndResize, {
			passive: true,
		});
		window.addEventListener("resize", handleScrollAndResize, {
			passive: true,
		});
		document.addEventListener("scroll", handleScrollAndResize, {
			passive: true,
		});

		// Cleanup event listeners and cancel pending animation frame
		return () => {
			if (rafId !== undefined) {
				cancelAnimationFrame(rafId);
			}
			window.removeEventListener("scroll", handleScrollAndResize);
			window.removeEventListener("resize", handleScrollAndResize);
			document.removeEventListener("scroll", handleScrollAndResize);
		};
	}, [hidePopover, popoverRef, triggerRef, updatePosition]);

	return { popoverPosition, placement, updatePosition };
}
