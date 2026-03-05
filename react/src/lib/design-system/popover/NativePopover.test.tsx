import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativePopover } from "./NativePopover";

describe("native popover", () => {
	it("renders with overflow-hidden by default", () => {
		const { container } = render(
			<NativePopover content={<div>Test content</div>} trigger="click">
				<button>Trigger</button>
			</NativePopover>
		);

		const popover = container.querySelector('[popover="auto"]');
		expect(popover?.className).toContain("overflow-hidden");
		expect(popover?.className).not.toContain("overflow-visible");
	});

	it("renders with overflow-visible when allowOverflow is true", () => {
		const { container } = render(
			<NativePopover content={<div>Test content</div>} trigger="click" allowOverflow>
				<button>Trigger</button>
			</NativePopover>
		);

		const popover = container.querySelector('[popover="auto"]');
		expect(popover?.className).toContain("overflow-visible");
		expect(popover?.className).not.toContain("overflow-hidden");
	});

	it("renders with overflow-hidden when allowOverflow is false", () => {
		const { container } = render(
			<NativePopover content={<div>Test content</div>} trigger="click" allowOverflow={false}>
				<button>Trigger</button>
			</NativePopover>
		);

		const popover = container.querySelector('[popover="auto"]');
		expect(popover?.className).toContain("overflow-hidden");
		expect(popover?.className).not.toContain("overflow-visible");
	});
});