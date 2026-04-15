import { useEffect, useId, useRef, useState } from "react";

import { type PlacementOption, type TriggerMode } from "./popover-types";
import usePopoverPositioning from "./position/usePopoverPositioning";

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
 *
 * @param preferredPlacement - Preferred placement for the popover (top/bottom/left/right)
 * @param trigger - Trigger mode for the popover (hover/click)
 * @param closeOnTriggerClick - Whether clicks on the trigger should close an open popover
 * @returns The `UseNativePopoverReturn` object containing refs, state, handlers and event callbacks
 */
export function useNativePopover({
	preferredPlacement,
	trigger,
	closeOnTriggerClick,
}: UseNativePopoverProps): UseNativePopoverReturn {
	// Refs needed to access DOM elements for positioning calculations and native popover API
	const triggerRef = useRef<HTMLElement | null>(null);
	/**
	 * Optional callback ref helper that sets the internal trigger ref.
	 *
	 * @param el - The trigger element or `null` when unmounting
	 * @returns void
	 */
	function setTriggerRef(el: HTMLElement | null): void {
		triggerRef.current = el;
	}
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const popoverId = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	/**
	 * Hide the popover, preferring the native `hidePopover` if available.
	 *
	 * @returns void
	 */
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

		/**
		 * Handle native `toggle` events emitted by the popover element.
		 *
		 * @param event - The native toggle event containing `newState`
		 * @returns void
		 */
		function handleToggle(event: Event): void {
			const newState: unknown = Reflect.get(event, "newState");
			setIsOpen(newState === "open");
		}

		popover.addEventListener("toggle", handleToggle);
		return (): void => {
			popover.removeEventListener("toggle", handleToggle);
		};
	}, []);

	/**
	 * Show the popover, using the native `showPopover` API when present.
	 *
	 * @returns void
	 */
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

	/**
	 * Toggle the popover open/closed based on current state.
	 *
	 * @returns void
	 */
	function togglePopover(): void {
		if (isOpen) {
			hidePopover();
		} else {
			showPopover();
		}
	}

	/**
	 * Open the popover when the trigger is hovered if configured.
	 *
	 * @returns void
	 */
	function handleMouseEnter(): void {
		if (trigger === "hover") {
			showPopover();
		}
	}

	/**
	 * Close the popover on mouse leave when in hover mode.
	 *
	 * @returns void
	 */
	function handleMouseLeave(): void {
		if (trigger === "hover") {
			hidePopover();
		}
	}

	/**
	 * Handle clicks on the trigger element according to `trigger` and
	 * `closeOnTriggerClick` configuration.
	 *
	 * @returns void
	 */
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

	/**
	 * Keyboard handler for accessibility: open/close on Enter/Space.
	 *
	 * @param ev - Keyboard event from the trigger element
	 * @returns void
	 */
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
