import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import ActiveSongSelectionSection from "./ActiveSongSelectionSection";
import useActiveSongSelectionState from "./useActiveSongSelectionState";

const FIRST_POSITION = 1;
const SECOND_POSITION = 2;

// oxlint-disable-next-line eslint-plugin-jest/no-untyped-mock-factory -- local test stub for translation only
vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, fallback: string, options?: { position?: number }) => string;
	} => ({
		t: (_key: string, fallback: string, options?: { position?: number }): string => {
			if (fallback === "Slide {{position}}" && options?.position !== undefined) {
				return `Slide ${options.position}`;
			}
			return fallback;
		},
	}),
}));

vi.mock("./useActiveSongSelectionState");

describe("active song selection section", () => {
	it("renders slide radios and calls onSelectActiveSlide for selected position", () => {
		const onSelectActiveSong = vi.fn();
		const onSelectActiveSlidePosition = vi.fn();

		vi.mocked(useActiveSongSelectionState).mockReturnValue(
			forceCast<ReturnType<typeof useActiveSongSelectionState>>({
				hasSelectedPlaylist: true,
				hasPlaylistSongs: true,
				hasNoPlaylistSongs: false,
				hasSelectedSong: true,
				hasSongSlides: true,
				hasNoSongSlides: false,
				availablePlaylistSongs: [{ songId: "song-1", songName: "Song One" }],
				availableSongSlidePositions: [
					{ slideId: "slide-1", position: 1 },
					{ slideId: "slide-2", position: 2 },
				],
			}),
		);

		render(
			<ActiveSongSelectionSection
				activePlaylistId="playlist-1"
				activeSongId="song-1"
				activeSlidePosition={FIRST_POSITION}
				onSelectActiveSong={onSelectActiveSong}
				onSelectActiveSlidePosition={onSelectActiveSlidePosition}
			/>,
		);

		const slideTwoRadio = screen.getByLabelText("Slide 2");
		fireEvent.click(slideTwoRadio);

		expect(screen.getByText("Active Slide Position")).toBeDefined();
		expect(slideTwoRadio).toBeDefined();
		expect(onSelectActiveSlidePosition).toHaveBeenCalledWith(SECOND_POSITION);
	});
});
