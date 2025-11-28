import { useEffect, useId, useRef, useState } from "react";

import { type PlacementOption, type TriggerMode } from "./types";
import { usePopoverPositioning } from "./usePopoverPositioning";

export type UseNativePopoverProps = Readonly<{
	preferredPlacement: PlacementOption;
	trigger: TriggerMode;
	closeOnTriggerClick: boolean;
}>;

export type UseNativePopoverReturn = {
	// Refs for DOM elements
	triggerRef: React.RefObject<HTMLElement | null>;
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

	handleKeyDown: (ev: React.KeyboardEvent) => void;
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
	const triggerRef = useRef<HTMLElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const popoverId = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	function hidePopover(): void {
		const popover = popoverRef.current;
		if (popover) {
			const maybeHide = Reflect.get(popover, "hidePopover");
			if (typeof maybeHide === "function") {
				(maybeHide as Function).call(popover);
			}
		}
		setIsOpen(false);
	}

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

		function handleToggle(event: Event): void {
			const newState: unknown = Reflect.get(event, "newState");
			setIsOpen(newState === "open");
		}

		popover.addEventListener("toggle", handleToggle);
		return () => {
			popover.removeEventListener("toggle", handleToggle);
		};
	}, []);

	function showPopover(): void {
		const popover = popoverRef.current;
		if (popover) {
			const maybeShow = Reflect.get(popover, "showPopover");
			if (typeof maybeShow === "function") {
				(maybeShow as Function).call(popover);
			}
		}
		setIsOpen(true);
		// Update position after popover is shown — requestAnimationFrame avoids a magic-number delay
		// Recalculate position on next frame so layout has settled.
		requestAnimationFrame(updatePositionExternal as FrameRequestCallback);
	}

	function togglePopover(): void {
		if (isOpen) {
			hidePopover();
		} else {
			showPopover();
		}
	}

	function handleMouseEnter(): void {
		if (trigger === "hover") {
			showPopover();
		}
	}

	function handleMouseLeave(): void {
		if (trigger === "hover") {
			hidePopover();
		}
	}

	function handleTriggerClick(): void {
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
	}

	function handleKeyDown(ev: React.KeyboardEvent): void {
		if (ev.key === "Enter" || ev.key === " ") {
			ev.preventDefault();
			handleTriggerClick();
		}
	}

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
