import { describe, expect, it } from "vitest";

import type { PlacementConfig } from "../popover-types";

import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";
import adjustTopBottomPosition from "./adjustTopBottomPosition";

describe("adjustTopBottomPosition", () => {
	it("adjusts horizontal and prevents overflow when transform is translateX(-50%)", () => {
		const popoverWidth = 200;
		const popoverHeight = 50;
		const viewportWidth = 240;
		const viewportHeight = 400;

		const placement: PlacementConfig = {
			name: "bottom",
			hasSpace: false,
			position: {},
		};
		const position = { top: 380, left: 10, transform: "translateX(-50%)" } as const;

		const res = adjustTopBottomPosition({
			placement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});

		const halfWidth = popoverWidth / CENTER_DIVISOR;
		const minLeft = halfWidth + MIN_MARGIN;
		const maxTop = viewportHeight - popoverHeight - MIN_MARGIN;

		expect(res.left).toBeGreaterThanOrEqual(minLeft);
		expect(res.top).toBeLessThanOrEqual(maxTop);
	});

	it("clamps top for top placement to MIN_MARGIN", () => {
		const popoverWidth = 100;
		const popoverHeight = 50;
		const viewportWidth = 300;
		const viewportHeight = 200;

		const placement: PlacementConfig = {
			name: "top",
			hasSpace: false,
			position: {},
		};
		const position = { top: -100, left: 50, transform: "translateX(-50%)" } as const;

		const res = adjustTopBottomPosition({
			placement,
			position,
			popoverWidth,
			popoverHeight,
			viewportWidth,
			viewportHeight,
		});

		expect(res.top).toBeGreaterThanOrEqual(MIN_MARGIN);
	});
});
