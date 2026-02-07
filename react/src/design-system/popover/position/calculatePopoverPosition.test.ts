import { describe, expect, it } from "vitest";

import { GAP_DEFAULT } from "../popover-constants";
import calculatePopoverPosition from "./calculatePopoverPosition";

describe("calculatePopoverPosition", () => {
	it("returns bottom placement when there is space below", () => {
		const previousInnerWidth = globalThis.innerWidth;
		const previousInnerHeight = globalThis.innerHeight;
		globalThis.innerWidth = 800;
		globalThis.innerHeight = 600;

		const LEFT = 100;
		const TOP = 10;
		const WIDTH = 40;
		const HEIGHT = 10;
		const triggerRect = new DOMRect(LEFT, TOP, WIDTH, HEIGHT);

		const { placement, position } = calculatePopoverPosition({
			triggerRect,
			popoverWidth: 200,
			popoverHeight: 50,
			preferredPlacement: "bottom",
		});

		expect(placement).toBe("bottom");
		expect(position.top).toBe(triggerRect.bottom + GAP_DEFAULT);
		expect(position.transform).toBe("translateX(-50%)");

		globalThis.innerWidth = previousInnerWidth;
		globalThis.innerHeight = previousInnerHeight;
	});

	it("falls back to right when bottom doesn't fit but right does", () => {
		const previousInnerWidth = globalThis.innerWidth;
		const previousInnerHeight = globalThis.innerHeight;
		globalThis.innerWidth = 400;
		globalThis.innerHeight = 100;

		const LEFT2 = 10;
		const TOP2 = 40;
		const WIDTH2 = 10;
		const HEIGHT2 = 20;
		const triggerRect = new DOMRect(LEFT2, TOP2, WIDTH2, HEIGHT2);

		const { placement } = calculatePopoverPosition({
			triggerRect,
			popoverWidth: 100,
			popoverHeight: 80,
			preferredPlacement: "bottom",
		});

		expect(placement).toBe("right");

		globalThis.innerWidth = previousInnerWidth;
		globalThis.innerHeight = previousInnerHeight;
	});

	it("selects best fit when no placement has space and adjusts positions", () => {
		const previousInnerWidth = globalThis.innerWidth;
		const previousInnerHeight = globalThis.innerHeight;
		globalThis.innerWidth = 100;
		globalThis.innerHeight = 100;

		const LEFT3 = 50;
		const TOP3 = 40;
		const WIDTH3 = 10;
		const HEIGHT3 = 20;
		const triggerRect = new DOMRect(LEFT3, TOP3, WIDTH3, HEIGHT3);

		const { placement, position } = calculatePopoverPosition({
			triggerRect,
			popoverWidth: 90,
			popoverHeight: 90,
			preferredPlacement: "bottom",
		});

		// Should pick a placement (not throw) and return numeric positions
		expect(typeof placement).toBe("string");
		expect(position).toHaveProperty("top");
		expect(position).toHaveProperty("left");

		globalThis.innerWidth = previousInnerWidth;
		globalThis.innerHeight = previousInnerHeight;
	});
});
