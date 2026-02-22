import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CollapsibleSection from "./CollapsibleSection";

describe("collapsible section", () => {
	const title = "My Section";
	const icon = <span data-testid="icon">ICON</span>;
	const children = <div data-testid="children">content</div>;

	it("renders title and icon", () => {
		const { unmount } = render(
			<CollapsibleSection title={title} icon={icon} isExpanded={false} onToggle={vi.fn()}>
				{children}
			</CollapsibleSection>,
		);

		const titleEl = screen.getByText(title);
		expect(titleEl).toBeTruthy();

		const iconEl = screen.getByTestId("icon");
		expect(iconEl).toBeTruthy();

		// children should not be visible when collapsed
		expect(screen.queryByTestId("children")).toBeNull();

		unmount();
	});

	it("shows children when expanded", () => {
		const { unmount } = render(
			<CollapsibleSection title={title} icon={icon} isExpanded onToggle={vi.fn()}>
				{children}
			</CollapsibleSection>,
		);

		expect(screen.getByTestId("children")).toBeTruthy();

		unmount();
	});

	it("calls onToggle when header is clicked", () => {
		const onToggle = vi.fn();
		const { getByRole } = render(
			<CollapsibleSection title={title} icon={icon} isExpanded={false} onToggle={onToggle}>
				{children}
			</CollapsibleSection>,
		);

		fireEvent.click(getByRole("button"));
		// handler receives click event
		expect(onToggle).toHaveBeenCalledWith(expect.any(Object));
	});

	it("rotates arrow based on isExpanded prop", () => {
		const { container, rerender, unmount } = render(
			<CollapsibleSection title={title} icon={icon} isExpanded={false} onToggle={vi.fn()}>
				{children}
			</CollapsibleSection>,
		);

		let svg = container.querySelector("svg");
		// when not expanded, should not have rotate-180 class
		expect(svg?.classList.contains("rotate-180")).toBe(false);

		rerender(
			<CollapsibleSection title={title} icon={icon} isExpanded onToggle={vi.fn()}>
				{children}
			</CollapsibleSection>,
		);

		svg = container.querySelector("svg");
		expect(svg?.classList.contains("rotate-180")).toBe(true);

		unmount();
	});
});
