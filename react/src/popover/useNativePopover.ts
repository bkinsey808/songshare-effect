import { useEffect, useId, useRef, useState } from "react";

import { type PlacementOption, type TriggerMode } from "./types";
import usePopoverPositioning from "./usePopoverPositioning";

export type UseNativePopoverProps = Readonly<{
	preferredPlacement: PlacementOption;
	trigger: TriggerMode;
	closeOnTriggerClick: boolean;
}>;

export type UseNativePopoverReturn = {
	// Refs for DOM elements
	triggerRef: React.RefObject<HTMLElement | null>;
	/** Optional callback ref helper so callers can set the trigger without
	 * requiring mutable ref assignments. Use this to avoid assigning into
	 * readonly RefObjects from components. */
	setTriggerRef: (el: HTMLElement | null) => void;
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
	const triggerRef = useRef<HTMLElement | null>(null);
	function setTriggerRef(el: HTMLElement | null): void {
		triggerRef.current = el;
	}
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const popoverId = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	function hidePopover(): void {
		const popover = popoverRef.current;
		if (popover) {
			const maybeHide = Reflect.get(popover, "hidePopover");
			if (typeof maybeHide === "function") {
				// Provide a concrete function signature instead of the banned `Function` type.
				// The method is invoked with `popover` as `this`.
				(maybeHide as (this: HTMLDivElement) => void).call(popover);
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
		return (): void => {
			popover.removeEventListener("toggle", handleToggle);
		};
	}, []);

	function showPopover(): void {
		const popover = popoverRef.current;
		if (popover) {
			const maybeShow = Reflect.get(popover, "showPopover");
			if (typeof maybeShow === "function") {
				// Provide an explicit signature for the callable instead of the generic `Function` type.
				(maybeShow as (this: HTMLDivElement) => void).call(popover);
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
		setTriggerRef,
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
