import { useEffect, useRef, useState } from "react";

type PickerPosition = Readonly<{
	top: number | undefined;
	bottom: number | undefined;
	left: number;
	width: number;
	maxHeight: number;
}>;

const PICKER_WIDTH = 512;
const VIEWPORT_GUTTER = 16;
const PICKER_VERTICAL_OFFSET = 0;
const PICKER_EDGE_OVERLAP = 1;
const VIEWPORT_GUTTER_MULTIPLIER = 2;
const MIN_PICKER_WIDTH = 320;
const MIN_PICKER_MAX_HEIGHT = 200;
const DEFAULT_REQUIRED_PICKER_HEIGHT = 320;
const ZERO_SPACE = 0;

type UseImagePickerPopoverParams = Readonly<{
	isOpen: boolean;
	onClose: () => void;
}>;

type UseImagePickerPopoverReturn = Readonly<{
	triggerRef: React.RefObject<HTMLSpanElement | null>;
	pickerRef: React.RefObject<HTMLDivElement | null>;
	pickerPosition: PickerPosition | undefined;
}>;

/**
 * Manages anchor refs, portal positioning, and outside-click closing for the floating image picker.
 *
 * @param isOpen - Whether the picker popover is currently open
 * @param onClose - Closes the picker when outside interactions occur
 * @returns Trigger ref, picker ref, and computed portal position
 */
export default function useImagePickerPopover({
	isOpen,
	onClose,
}: UseImagePickerPopoverParams): UseImagePickerPopoverReturn {
	const triggerRef = useRef<HTMLSpanElement | null>(null);
	const pickerRef = useRef<HTMLDivElement | null>(null);
	const [pickerPosition, setPickerPosition] = useState<PickerPosition | undefined>(undefined);

	/**
	 * Compute and set the floating picker's portal position relative to the trigger.
	 *
	 * Determines whether the picker opens above or below the trigger and computes
	 * dimensions constrained to the viewport.
	 *
	 * @returns void
	 */
	function updatePickerPosition(): void {
		const triggerElement = triggerRef.current;
		if (!triggerElement) {
			return;
		}

		const anchorElement = triggerElement.querySelector("button") ?? triggerElement;
		const rect = anchorElement.getBoundingClientRect();
		const availableWidth = Math.max(
			window.innerWidth - VIEWPORT_GUTTER * VIEWPORT_GUTTER_MULTIPLIER,
			MIN_PICKER_WIDTH,
		);
		const width = Math.min(PICKER_WIDTH, availableWidth);
		const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER);
		const preferredLeft = rect.left;
		const left = Math.min(Math.max(preferredLeft, VIEWPORT_GUTTER), maxLeft);
		const spaceAbove = Math.max(
			rect.top - VIEWPORT_GUTTER - PICKER_VERTICAL_OFFSET,
			ZERO_SPACE,
		);
		const spaceBelow = Math.max(
			window.innerHeight - rect.bottom - VIEWPORT_GUTTER - PICKER_VERTICAL_OFFSET,
			ZERO_SPACE,
		);
		const measuredPickerHeight = pickerRef.current?.scrollHeight;
		const requiredPickerHeight = Math.max(
			Math.min(
				measuredPickerHeight ?? DEFAULT_REQUIRED_PICKER_HEIGHT,
				window.innerHeight - VIEWPORT_GUTTER * VIEWPORT_GUTTER_MULTIPLIER,
			),
			MIN_PICKER_MAX_HEIGHT,
		);
		const canFitBelow = spaceBelow >= requiredPickerHeight;
		const canFitAbove = spaceAbove >= requiredPickerHeight;
		let shouldOpenAbove = false;
		if (canFitBelow) {
			shouldOpenAbove = false;
		} else if (canFitAbove) {
			shouldOpenAbove = true;
		} else {
			shouldOpenAbove = spaceAbove > spaceBelow;
		}
		const maxHeight = Math.max(
			shouldOpenAbove ? spaceAbove : spaceBelow,
			MIN_PICKER_MAX_HEIGHT,
		);
		const top = shouldOpenAbove
			? undefined
			: Math.min(
					rect.bottom + PICKER_VERTICAL_OFFSET - PICKER_EDGE_OVERLAP,
					window.innerHeight - VIEWPORT_GUTTER - MIN_PICKER_MAX_HEIGHT,
				);
		const bottom = shouldOpenAbove
			? Math.max(
					window.innerHeight - rect.top + PICKER_VERTICAL_OFFSET - PICKER_EDGE_OVERLAP,
					VIEWPORT_GUTTER,
				)
			: undefined;

		setPickerPosition({
			top,
			bottom,
			left,
			width,
			maxHeight,
		});
	}

	// Keep the floating picker aligned to the trigger while the viewport changes.
	useEffect(() => {
		if (!isOpen) {
			setPickerPosition(undefined);
			return;
		}

		updatePickerPosition();
		const animationFrameId = globalThis.requestAnimationFrame(() => {
			updatePickerPosition();
		});

		/**
		 * Keep the picker aligned to the trigger when the viewport changes.
		 *
		 * @returns void
		 */
		function handleViewportChange(): void {
			updatePickerPosition();
		}

		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, true);

		return (): void => {
			globalThis.cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", handleViewportChange);
			window.removeEventListener("scroll", handleViewportChange, true);
		};
	}, [isOpen]);

	// Close the floating picker when the user clicks outside the trigger and picker.
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		/**
		 * Close the picker when the user clicks outside the trigger and picker.
		 *
		 * @param event - Native mouse event from the document.
		 * @returns void
		 */
		function handlePointerDown(event: MouseEvent): void {
			const { target } = event;
			if (!(target instanceof Node)) {
				return;
			}

			const isInsideTrigger = triggerRef.current?.contains(target) === true;
			const isInsidePicker = pickerRef.current?.contains(target) === true;
			if (isInsideTrigger || isInsidePicker) {
				return;
			}

			onClose();
		}

		document.addEventListener("mousedown", handlePointerDown);

		return (): void => {
			document.removeEventListener("mousedown", handlePointerDown);
		};
	}, [isOpen, onClose]);

	return {
		triggerRef,
		pickerRef,
		pickerPosition,
	};
}
