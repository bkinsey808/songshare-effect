import { describe, expect, it } from "vitest";

import type { PlacementConfig } from "../popover-types";

import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";
import adjustLeftRightPosition from "./adjustLeftRightPosition";

describe("adjustLeftRightPosition", () => {
	it("adjusts vertical and prevents overflow when transform is translateY(-50%)", () => {
		const popoverWidth = 100;
		const popoverHeight = 200;
		const viewportWidth = 400;
		const viewportHeight = 240;

		const placement: PlacementConfig = {
			name: "right",
			hasSpace: false,
			position: {},
		};
		const position = { top: 10, left: 350, transform: "translateY(-50%)" } as const;

		const res = adjustLeftRightPosition({
			placement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});

		const halfHeight = popoverHeight / CENTER_DIVISOR;
		const minTop = halfHeight + MIN_MARGIN;
		const maxLeft = viewportWidth - popoverWidth - MIN_MARGIN;

		expect(res.top).toBeGreaterThanOrEqual(minTop);
		expect(res.left).toBeLessThanOrEqual(maxLeft);
	});

	it("clamps left for left placement to MIN_MARGIN", () => {
		const popoverWidth = 100;
		const popoverHeight = 50;
		const viewportWidth = 200;
		const viewportHeight = 300;

		const placement: PlacementConfig = {
			name: "left",
			hasSpace: false,
			position: {},
		};
		const position = { top: 50, left: 0 } as const;

		const res = adjustLeftRightPosition({
			placement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});

		expect(res.left).toBeGreaterThanOrEqual(MIN_MARGIN);
	});
});
