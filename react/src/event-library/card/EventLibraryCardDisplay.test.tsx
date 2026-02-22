import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";

import makeEventLibraryEntry from "../test-utils/makeEventLibraryEntry.mock";
import EventLibraryCardDisplay from "./EventLibraryCardDisplay";

vi.mock("react-i18next");

// This test focuses on the presence of navigation links in the card.
// The slide manager button was recently added to support quick access from
// the library page; we assert it renders with the correct URL.

describe("eventLibraryCardDisplay", () => {
	it("renders a slide manager link alongside other action links", () => {
		mockUseTranslation();
		const entry = makeEventLibraryEntry();
		render(
			<MemoryRouter>
				<EventLibraryCardDisplay entry={entry} onDeleteClick={() => undefined} />
			</MemoryRouter>,
		);

		// basic navigation links should be present
		expect(screen.getByRole("link", { name: "View Event" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Manage Event" })).toBeTruthy();

		// slide manager link should exist and point at the expected path
		const slideLink = screen.getByRole("link", { name: "Slide Manager" });
		expect(slideLink).toBeTruthy();
		// href contains the slide-manager suffix for this event slug
		expect(slideLink.getAttribute("href")).toContain("/events/test-event/slide-manager");
	});
});
