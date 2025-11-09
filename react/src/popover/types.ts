/** CSS positioning properties for popover element */
export type PopoverPosition = {
	readonly top?: number;
	readonly bottom?: number;
	readonly left?: number;
	readonly right?: number;
	readonly transform?: string;
};

/** Available placement options relative to trigger element */
export type PlacementOption = "top" | "bottom" | "left" | "right";

/** Supported trigger modes for showing/hiding popover */
export type TriggerMode = "hover" | "click";

/** Type-safe definition for native HTML popover elements */
export type PopoverElement = HTMLElement & {
	readonly showPopover?: () => void;
	readonly hidePopover?: () => void;
};
