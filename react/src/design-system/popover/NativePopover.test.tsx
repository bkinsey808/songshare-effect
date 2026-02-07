import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativePopover } from "./NativePopover";

describe("<NativePopover />", () => {
	it("renders trigger and popover with correct ARIA attrs and toggles on click", () => {
		render(
			<NativePopover trigger="click" content={<div>Pop Content</div>}>
				Open
			</NativePopover>,
		);

		const button = screen.getByRole("button");
		expect(button).toBeTruthy();

		// Initially closed
		expect(button.getAttribute("aria-expanded")).not.toBe("true");

		// Click to open
		fireEvent.click(button);

		// When opened with click mode, aria-expanded should be true
		expect(button.getAttribute("aria-expanded")).toBe("true");

		// Popover element should contain the content
		const popContent = screen.getByText("Pop Content");
		expect(popContent).toBeTruthy();
	});
});
