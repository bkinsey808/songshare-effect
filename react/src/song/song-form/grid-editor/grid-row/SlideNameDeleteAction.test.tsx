import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SlideNameDeleteAction from "./SlideNameDeleteAction";

const SLIDE_ID = "slide-1";
const OTHER_SLIDE_ID = "slide-2";

type Props = React.ComponentProps<typeof SlideNameDeleteAction>;

/**
 * Builds complete props for rendering `SlideNameDeleteAction` in tests.
 *
 * @param overrides - Partial prop overrides for the scenario under test
 * @returns Fully populated delete-action props
 */
function makeProps(overrides: Partial<Props> = {}): Props {
	return {
		slideId: SLIDE_ID,
		slideOrder: [SLIDE_ID, OTHER_SLIDE_ID],
		idx: 0,
		setSlideOrder: vi.fn(),
		deleteSlide: vi.fn(),
		confirmingDelete: false,
		setConfirmingDelete: vi.fn(),
		globalIsDragging: false,
		...overrides,
	};
}

describe("slideNameDeleteAction", () => {
	it("renders a remove button for duplicate slide instances", () => {
		// Arrange
		const props = makeProps({ slideOrder: [SLIDE_ID, SLIDE_ID, OTHER_SLIDE_ID] });

		// Act
		render(<SlideNameDeleteAction {...props} />);

		// Assert
		expect(screen.getByRole("button", { name: "Remove from Presentation" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Delete Slide" })).toBeNull();
	});

	it("renders delete confirmation controls when confirming the last instance", () => {
		// Arrange
		const props = makeProps({ confirmingDelete: true });

		// Act
		render(<SlideNameDeleteAction {...props} />);

		// Assert
		expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
	});

	it("opens delete confirmation for a single slide instance", () => {
		// Arrange
		const setConfirmingDelete = vi.fn();
		const props = makeProps({
			slideOrder: [SLIDE_ID, OTHER_SLIDE_ID],
			setConfirmingDelete,
		});

		// Act
		render(<SlideNameDeleteAction {...props} />);
		fireEvent.click(screen.getByRole("button", { name: "Delete Slide" }));

		// Assert
		expect(setConfirmingDelete).toHaveBeenCalledWith(true);
	});
});
