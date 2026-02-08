import type { RefObject } from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import asNull from "@/react/lib/test-utils/asNull";

import calculateAndUpdatePosition from "./calculateAndUpdatePosition";
import usePopoverPositioning from "./usePopoverPositioning";

vi.mock("./calculateAndUpdatePosition");

describe("usePopoverPositioning", () => {
	const FAKE_RAF_ID = 1;
	const FAKE_RAF_TIME = 0;

	function setupFakeRaf(): { restore: () => void; getCancelledId: () => number } {
		const oldRAF = globalThis.requestAnimationFrame;
		const oldCancel = globalThis.cancelAnimationFrame;
		let _cancelledId = -1;

		globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
			cb(FAKE_RAF_TIME);
			return FAKE_RAF_ID;
		};
		globalThis.cancelAnimationFrame = (id: number): void => {
			_cancelledId = id;
		};

		return {
			restore: () => {
				globalThis.requestAnimationFrame = oldRAF;
				globalThis.cancelAnimationFrame = oldCancel;
				vi.resetAllMocks();
			},
			getCancelledId: () => _cancelledId,
		};
	}

	it("calls calculateAndUpdatePosition on updatePosition", () => {
		const { restore, getCancelledId } = setupFakeRaf();
		// explicit null to exercise branch in the hook
		const triggerRef: RefObject<HTMLElement | null> = { current: asNull() };
		const popoverRef: RefObject<HTMLDivElement | null> = { current: asNull() };
		const hidePopover = vi.fn();

		// Use the helper to avoid unused variable linter warnings
		getCancelledId();

		const { result } = renderHook(() =>
			usePopoverPositioning({ triggerRef, popoverRef, preferredPlacement: "bottom", hidePopover }),
		);

		result.current.updatePosition();
		expect(calculateAndUpdatePosition).toHaveBeenCalledWith(
			expect.objectContaining({ preferredPlacement: "bottom" }),
		);
		// restore globals and consume helper values to satisfy linter
		restore();
	});

	it("calls hidePopover when trigger is offscreen on scroll", () => {
		const { restore, getCancelledId } = setupFakeRaf();
		const TR_X = 0;
		const TR_Y = 1000;
		const TR_W = 10;
		const TR_H = 10;
		const triggerRect = new DOMRect(TR_X, TR_Y, TR_W, TR_H);

		const popoverEl = document.createElement("div");
		// Ensure popover matches and has a bounding rect
		const PO_X = 0;
		const PO_Y = 0;
		Object.defineProperty(popoverEl, "matches", { value: (): boolean => true, configurable: true });
		Object.defineProperty(popoverEl, "getBoundingClientRect", {
			value: (): DOMRect => new DOMRect(PO_X, PO_Y, TR_W, TR_H),
			configurable: true,
		});

		const triggerEl = document.createElement("div");
		triggerEl.getBoundingClientRect = (): DOMRect => triggerRect;
		const triggerRef: RefObject<HTMLElement | null> = { current: triggerEl };
		const popoverRef: RefObject<HTMLDivElement | null> = { current: popoverEl };

		const hidePopover = vi.fn();

		renderHook(() =>
			usePopoverPositioning({ triggerRef, popoverRef, preferredPlacement: "bottom", hidePopover }),
		);

		// Dispatch scroll event
		globalThis.dispatchEvent(new Event("scroll"));

		expect(hidePopover).toHaveBeenCalledWith();
		// consume helper values and restore globals to satisfy linter
		getCancelledId();
		restore();
	});
});
