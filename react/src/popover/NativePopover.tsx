import type { PlacementOption, TriggerMode } from "./types";

import { getArrowClasses } from "./getArrowClasses";
import { useNativePopover } from "./useNativePopover";

export type NativePopoverProps = Readonly<{
	/** The trigger element content */
	children: React.ReactNode;
	/** The popover content to display */
	content: React.ReactNode;
	/** Preferred placement relative to trigger element */
	preferredPlacement?: PlacementOption;
	/** How the popover is triggered - hover or click */
	trigger?: TriggerMode;
	/** Whether clicking the trigger should close the popover when trigger is hover */
	closeOnTriggerClick?: boolean;
	/** Custom tabIndex for the trigger element. Defaults to 0 for keyboard accessibility */
	tabIndex?: number;
}>;

/**
 * Native HTML Popover API component with dual-mode support (hover/click)
 * Features smart positioning, scroll tracking, and auto-close functionality
 */
export function NativePopover({
	children,
	content,
	preferredPlacement = "bottom",
	trigger = "hover",
	closeOnTriggerClick = false,
	tabIndex = 0,
}: NativePopoverProps): ReactElement {
	// Use custom hook that encapsulates all popover logic
	const {
		triggerRef,
		popoverRef,
		popoverId,
		isOpen,
		popoverPosition,
		placement,
		handleMouseEnter,
		handleMouseLeave,
		handleTriggerClick,
		handleKeyDown,
	} = useNativePopover({
		preferredPlacement,
		trigger,
		closeOnTriggerClick,
	});

	// Accessibility: Different ARIA patterns for hover vs click modes
	// Hover mode: tooltip pattern with aria-describedby relationship
	// Click mode: dialog pattern with aria-expanded and bidirectional labeling

	return (
		<div className="relative inline-block">
			<div
				ref={triggerRef}
				id={trigger === "click" ? `${popoverId}-trigger` : undefined}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onClick={handleTriggerClick}
				onKeyDown={handleKeyDown}
				role="button"
				tabIndex={tabIndex}
				aria-describedby={isOpen ? popoverId : undefined}
				aria-expanded={trigger === "click" ? isOpen : undefined}
				className="cursor-pointer"
			>
				{children}
			</div>

			<div
				ref={popoverRef}
				id={popoverId}
				popover="auto"
				className="max-w-64 overflow-hidden rounded-lg bg-gray-800 p-4 shadow-lg ring-1 ring-white/10"
				style={popoverPosition}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				role={trigger === "hover" ? "tooltip" : "dialog"}
				aria-labelledby={
					trigger === "click" ? `${popoverId}-trigger` : undefined
				}
			>
				{/* Arrow indicator */}
				<div
					className={`absolute h-2 w-2 rotate-45 bg-gray-800 ${getArrowClasses(placement)}`}
				/>
				{content}
			</div>
		</div>
	);
}
