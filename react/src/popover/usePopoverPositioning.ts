import { useEffect, useState } from "react";

import calculatePopoverPosition from "./calculatePopoverPosition";
import type { PlacementOption, PopoverPosition } from "./types";

/**
 * Custom hook to handle popover positioning and scroll tracking
 * Automatically positions popover relative to trigger and handles scroll events
 */
export function usePopoverPositioning(
	triggerRef: React.RefObject<HTMLDivElement | null>,
	popoverRef: React.RefObject<HTMLDivElement | null>,
	preferredPlacement: PlacementOption,
	hidePopover: () => void,
): {
	popoverPosition: PopoverPosition;
	placement: PlacementOption;
	updatePosition: () => void;
} {
	const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({});
	const [placement, setPlacement] = useState<PlacementOption>("bottom");

	// Handle scroll events to keep popover positioned relative to trigger
	useEffect(() => {
		let rafId: number | undefined;

		const updatePosition = (): void => {
			if (triggerRef.current !== null && popoverRef.current !== null) {
				const triggerRect = triggerRef.current.getBoundingClientRect();
				const popoverRect = popoverRef.current.getBoundingClientRect();

				const { position, placement: calculatedPlacement } =
					calculatePopoverPosition(
						triggerRect,
						popoverRect.width || 256,
						popoverRect.height || 200,
						preferredPlacement,
					);

				setPopoverPosition(position);
				setPlacement(calculatedPlacement);
			}
		};

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
	}, [preferredPlacement, hidePopover, popoverRef, triggerRef]);

	// Create updatePosition function for external use
	// eslint-disable-next-line sonarjs/no-identical-functions
	const updatePositionExternal = (): void => {
		if (triggerRef.current !== null && popoverRef.current !== null) {
			const triggerRect = triggerRef.current.getBoundingClientRect();
			const popoverRect = popoverRef.current.getBoundingClientRect();

			const { position, placement: calculatedPlacement } =
				calculatePopoverPosition(
					triggerRect,
					popoverRect.width || 256,
					popoverRect.height || 200,
					preferredPlacement,
				);

			setPopoverPosition(position);
			setPlacement(calculatedPlacement);
		}
	};

	return { popoverPosition, placement, updatePosition: updatePositionExternal };
}
