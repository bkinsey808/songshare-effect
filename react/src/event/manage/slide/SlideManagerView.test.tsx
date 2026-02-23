import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";
import setUseSlideManagerViewReturn from "@/react/event/manage/test-utils/setUseSlideManagerViewReturn.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import { ZERO } from "@/shared/constants/shared-constants";

import type { UseSlideManagerViewResult } from "./useSlideManagerView";

// delegate mocking logic to helper so lint disables live there

describe("slidemanager view", () => {
	// reset mocks individually to avoid using beforeEach hook

	it("renders nothing when access denied", async () => {
		mockUseSlideManagerView();
		const fakeState = forceCast<UseSlideManagerViewResult>({
			canAccess: false,
			activeSlidePosition: undefined,
			availablePlaylistSongs: [],
			availableSongSlidePositions: [],
			activePlaylistId: undefined,
			activeSongId: undefined,
			updateActiveSong: vi.fn(),
			updateActiveSlidePosition: vi.fn(),
			activeSongTotalSlides: 0,
		});

		setUseSlideManagerViewReturn(fakeState);

		const { default: SlideManagerView } = await import("./SlideManagerView");

		const { container } = render(
			<MemoryRouter>
				<SlideManagerView />
			</MemoryRouter>,
		);
		// component returns a trivial <span /> when access is denied
		expect(container.firstChild?.nodeName).toBe("SPAN");
	});

	it("shows navigation when access granted", async () => {
		mockUseSlideManagerView();
		const fakeState2 = forceCast<UseSlideManagerViewResult>({
			canAccess: true,
			activeSlidePosition: 3,
			availablePlaylistSongs: [{ songId: "s", songName: "S" }],
			availableSongSlidePositions: [{ slideId: "sl", position: 1, slideName: "Slide One" }],
			activePlaylistId: "p",
			activeSongId: "s",
			updateActiveSong: vi.fn(),
			updateActiveSlidePosition: vi.fn(),
			handleSlideSelectChange: vi.fn(),
			activeSongTotalSlides: 1,
		});

		setUseSlideManagerViewReturn(fakeState2);

		const { default: SlideManagerView } = await import("./SlideManagerView");

		render(
			<MemoryRouter>
				<SlideManagerView />
			</MemoryRouter>,
		);

		// basic existence assertions
		expect(screen.getAllByText("Prev").length).toBeGreaterThan(ZERO);
		expect(screen.getAllByText("Next").length).toBeGreaterThan(ZERO);
		// slide dropdown should include the slide name (text match is sufficient)
		screen.getByText("1 – Slide One");
	});
});
