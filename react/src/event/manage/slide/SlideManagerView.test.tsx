import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import SlideManagerView from "./SlideManagerView";
import useSlideManagerState, { type UseSlideManagerStateResult } from "./useSlideManager";

vi.mock("./useSlideManager");

describe("slidemanager view", () => {
	// reset mocks individually to avoid using beforeEach hook

	it("renders nothing when access denied", () => {
		const fakeState: UseSlideManagerStateResult = {
			canAccess: false,
			activeSlidePosition: undefined,
			availablePlaylistSongs: [],
			availableSongSlidePositions: [],
			activePlaylistId: undefined,
			activeSongId: undefined,
			updateActiveSong: vi.fn(),
			updateActiveSlidePosition: vi.fn(),
			activeSongTotalSlides: 0,
		};
		vi.resetAllMocks();
		const mockedUseSlideManagerState = vi.mocked(useSlideManagerState);
		mockedUseSlideManagerState.mockReturnValue(fakeState);

		const { container } = render(
			<MemoryRouter>
				<SlideManagerView />
			</MemoryRouter>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("shows navigation when access granted", () => {
		const fakeState2: UseSlideManagerStateResult = {
			canAccess: true,
			activeSlidePosition: 3,
			availablePlaylistSongs: [{ songId: "s", songName: "S" }],
			availableSongSlidePositions: [{ slideId: "sl", position: 1, slideName: "" }],
			activePlaylistId: "p",
			activeSongId: "s",
			updateActiveSong: vi.fn(),
			updateActiveSlidePosition: vi.fn(),
			activeSongTotalSlides: 1,
		};
		vi.resetAllMocks();
		const mockedUseSlideManagerState = vi.mocked(useSlideManagerState);
		mockedUseSlideManagerState.mockReturnValue(fakeState2);

		render(
			<MemoryRouter>
				<SlideManagerView />
			</MemoryRouter>,
		);

		// basic existence assertions
		expect(screen.getAllByText("Prev").length).toBeGreaterThan(ZERO);
		expect(screen.getAllByText("Next").length).toBeGreaterThan(ZERO);
	});
});
