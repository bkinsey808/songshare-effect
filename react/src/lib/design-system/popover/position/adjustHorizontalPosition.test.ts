import { describe, expect, it } from "vitest";

import { CENTER_DIVISOR, MIN_MARGIN } from "../popover-constants";
import adjustHorizontalPosition from "./adjustHorizontalPosition";

describe("adjustHorizontalPosition", () => {
	it("adjusts left when transform is translateX(-50%) and left is too small", () => {
		const popoverWidth = 200;
		const viewportWidth = 300;
		const position = { left: 50, transform: "translateX(-50%)" } as const;

		const res = adjustHorizontalPosition({ position, popoverWidth, viewportWidth });

		const halfWidth = popoverWidth / CENTER_DIVISOR;
		const minLeft = halfWidth + MIN_MARGIN;
		expect(res.left).toBe(minLeft);
	});

	it("clamps left to max when too large", () => {
		const popoverWidth = 200;
		const viewportWidth = 300;
		const position = { left: 1000, transform: "translateX(-50%)" } as const;

		const res = adjustHorizontalPosition({ position, popoverWidth, viewportWidth });

		const halfWidth = popoverWidth / CENTER_DIVISOR;
		const maxLeft = viewportWidth - halfWidth - MIN_MARGIN;
		expect(res.left).toBe(maxLeft);
	});

	it("returns original position when transform is not translateX(-50%)", () => {
		const popoverWidth = 200;
		const viewportWidth = 300;
		const position = { left: 20 } as const;

		const res = adjustHorizontalPosition({ position, popoverWidth, viewportWidth });
		expect(res).toStrictEqual(position);
	});
});
