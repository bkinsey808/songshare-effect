import type { RefObject } from "react";

import { describe, expect, it, vi } from "vitest";

import asNull from "@/react/lib/test-utils/asNull";

import calculateAndUpdatePosition from "./calculateAndUpdatePosition";
import calculatePopoverPosition from "./calculatePopoverPosition";

vi.mock("./calculatePopoverPosition");

describe("calculateAndUpdatePosition", () => {
	it("does nothing when refs are null", () => {
		// explicit null to exercise branch in the hook
		const triggerRef: RefObject<HTMLElement | null> = { current: asNull() };
		const popoverRef: RefObject<HTMLDivElement | null> = { current: asNull() };
		const setPopoverPosition = vi.fn();
		const setPlacement = vi.fn();

		calculateAndUpdatePosition({
			triggerRef,
			popoverRef,
			preferredPlacement: "bottom",
			setPopoverPosition,
			setPlacement,
		});

		expect(setPopoverPosition).not.toHaveBeenCalled();
		expect(setPlacement).not.toHaveBeenCalled();
	});

	it("calls calculatePopoverPosition and applies setters when refs present", () => {
		const TR_X = 0;
		const TR_Y = 1;
		const TR_W = 0;
		const TR_H = 0;
		const triggerRect = new DOMRect(TR_X, TR_Y, TR_W, TR_H);

		const PR_X = 0;
		const PR_Y = 0;
		const PR_W = 100;
		const PR_H = 50;
		const popoverRect = new DOMRect(PR_X, PR_Y, PR_W, PR_H);

		const triggerEl = document.createElement("div");
		triggerEl.getBoundingClientRect = (): DOMRect => triggerRect;
		const triggerRef: RefObject<HTMLElement | null> = { current: triggerEl };
		const popoverEl = document.createElement("div");
		popoverEl.getBoundingClientRect = (): DOMRect => popoverRect;
		const popoverRef: RefObject<HTMLDivElement | null> = { current: popoverEl };

		const setPopoverPosition = vi.fn();
		const setPlacement = vi.fn();

		vi.mocked(calculatePopoverPosition).mockReturnValue({
			position: { top: 10, left: 20 },
			placement: "bottom",
		});

		calculateAndUpdatePosition({
			triggerRef,
			popoverRef,
			preferredPlacement: "bottom",
			setPopoverPosition,
			setPlacement,
		});

		expect(calculatePopoverPosition).toHaveBeenCalledWith(
			expect.objectContaining({ preferredPlacement: "bottom" }),
		);
		expect(setPopoverPosition).toHaveBeenCalledWith({ top: 10, left: 20 });
		expect(setPlacement).toHaveBeenCalledWith("bottom");
	});
});
