import { useEffect, useId, useRef, useState } from "react";

import type { PlacementOption, PopoverElement, TriggerMode } from "./types";
import { usePopoverPositioning } from "./usePopoverPositioning";

export type UseNativePopoverProps = {
	preferredPlacement: PlacementOption;
	trigger: TriggerMode;
	closeOnTriggerClick: boolean;
};

export type UseNativePopoverReturn = {
	// Refs for DOM elements
	triggerRef: React.RefObject<HTMLDivElement | null>;
	popoverRef: React.RefObject<HTMLDivElement | null>;
	popoverId: string;

	// State
	isOpen: boolean;
	popoverPosition: ReturnType<typeof usePopoverPositioning>["popoverPosition"];
	placement: ReturnType<typeof usePopoverPositioning>["placement"];

	// Actions
	showPopover: () => void;
	hidePopover: () => void;
	togglePopover: () => void;

	// Event handlers
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
	handleTriggerClick: () => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
};

/**
 * Custom hook that encapsulates all native popover logic
 * Handles state management, event handlers, and positioning
 */
export function useNativePopover({
	preferredPlacement,
	trigger,
	closeOnTriggerClick,
}: UseNativePopoverProps): UseNativePopoverReturn {
	// Refs needed to access DOM elements for positioning calculations and native popover API
	const triggerRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const popoverId = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const hidePopover = (): void => {
		(popoverRef.current as PopoverElement)?.hidePopover();
		setIsOpen(false);
	};

	// Use custom positioning hook
	const {
		popoverPosition,
		placement,
		updatePosition: updatePositionExternal,
	} = usePopoverPositioning({
		triggerRef,
		popoverRef,
		preferredPlacement,
		hidePopover,
	});

	// Listen for native popover toggle events to sync our state
	useEffect(() => {
		const popover = popoverRef.current;
		if (!popover) {
			return;
		}

		const handleToggle = (event: Event): void => {
			const toggleEvent = event as Event & { newState: string };
			setIsOpen(toggleEvent.newState === "open");
		};

		popover.addEventListener("toggle", handleToggle);
		return () => {
			popover.removeEventListener("toggle", handleToggle);
		};
	}, []);

	const showPopover = (): void => {
		const popover = popoverRef.current as PopoverElement;
		popover?.showPopover();
		setIsOpen(true);
		// Update position after popover is shown
		setTimeout(updatePositionExternal, 0);
	};

	const togglePopover = (): void => {
		if (isOpen) {
			hidePopover();
		} else {
			showPopover();
		}
	};

	const handleMouseEnter = (): void => {
		if (trigger === "hover") {
			showPopover();
		}
	};

	const handleMouseLeave = (): void => {
		if (trigger === "hover") {
			hidePopover();
		}
	};

	const handleTriggerClick = (): void => {
		if (trigger === "click") {
			togglePopover();
		} else if (trigger === "hover") {
			// In hover mode: click opens if closed, closeOnTriggerClick determines if click can close
			if (!isOpen) {
				showPopover();
			} else if (closeOnTriggerClick) {
				hidePopover();
			}
		}
	};

	const handleKeyDown = (ev: React.KeyboardEvent): void => {
		if (ev.key === "Enter" || ev.key === " ") {
			ev.preventDefault();
			handleTriggerClick();
		}
	};

	return {
		// Refs for DOM elements
		triggerRef,
		popoverRef,
		popoverId,

		// State
		isOpen,
		popoverPosition,
		placement,

		// Actions
		showPopover,
		hidePopover,
		togglePopover,

		// Event handlers
		handleMouseEnter,
		handleMouseLeave,
		handleTriggerClick,
		handleKeyDown,
	};
}
