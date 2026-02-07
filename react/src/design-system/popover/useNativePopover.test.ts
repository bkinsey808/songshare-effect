import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeKeyboardEventWithPreventDefault } from "@/react/test-utils/dom-events";

// eslint-disable-next-line import/no-namespace
import * as usePopoverPositioningModule from "./position/usePopoverPositioning";
import { useNativePopover } from "./useNativePopover";

vi.spyOn(usePopoverPositioningModule, "default").mockReturnValue({
	popoverPosition: {},
	placement: "bottom",
	updatePosition: vi.fn(),
});

describe("useNativePopover", () => {
	it("showPopover calls native show and sets isOpen", async () => {
		const { result } = renderHook(() =>
			useNativePopover({
				preferredPlacement: "bottom",
				trigger: "click",
				closeOnTriggerClick: false,
			}),
		);

		// Provide a fake popover element with showPopover
		const show = vi.fn();
		const popoverEl = document.createElement("div");
		Object.defineProperty(popoverEl, "showPopover", { value: show, configurable: true });
		result.current.popoverRef.current = popoverEl;

		// Call and wait for state to update
		result.current.showPopover();
		await waitFor(() => {
			expect(show).toHaveBeenCalledWith();
		});
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});
	});

	it("hidePopover calls native hide and sets isOpen false", () => {
		const { result } = renderHook(() =>
			useNativePopover({
				preferredPlacement: "bottom",
				trigger: "click",
				closeOnTriggerClick: false,
			}),
		);

		const hide = vi.fn();
		const popoverElHide = document.createElement("div");
		Object.defineProperty(popoverElHide, "hidePopover", { value: hide, configurable: true });
		result.current.popoverRef.current = popoverElHide;

		// Open first using showPopover so internal state changes
		result.current.showPopover();

		result.current.hidePopover();

		expect(hide).toHaveBeenCalledWith();
		expect(result.current.isOpen).toBe(false);
	});

	it("handleTriggerClick toggles in click mode", async () => {
		const { result } = renderHook(() =>
			useNativePopover({
				preferredPlacement: "bottom",
				trigger: "click",
				closeOnTriggerClick: false,
			}),
		);

		result.current.handleTriggerClick();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		result.current.handleTriggerClick();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("handleMouseEnter/Leave show/hide when trigger is hover", async () => {
		const { result } = renderHook(() =>
			useNativePopover({
				preferredPlacement: "bottom",
				trigger: "hover",
				closeOnTriggerClick: false,
			}),
		);

		result.current.handleMouseEnter();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		result.current.handleMouseLeave();
		await waitFor(() => {
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("handleKeyDown triggers click on Enter or Space", async () => {
		const { result } = renderHook(() =>
			useNativePopover({
				preferredPlacement: "bottom",
				trigger: "click",
				closeOnTriggerClick: false,
			}),
		);

		const { event: ev, preventDefault: prevent } = makeKeyboardEventWithPreventDefault("Enter");
		result.current.handleKeyDown(ev);
		await waitFor(() => {
			expect(prevent).toHaveBeenCalledWith();
		});
		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		const { event: ev2, preventDefault: prevent2 } = makeKeyboardEventWithPreventDefault(" ");
		result.current.handleKeyDown(ev2);
		await waitFor(() => {
			expect(prevent2).toHaveBeenCalledWith();
		});
	});
});
