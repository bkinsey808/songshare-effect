import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import SlideOrientationSelect from "@/react/slide-orientation/SlideOrientationSelect";
import type { SongPublic } from "@/react/song/song-schema";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.test-util";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";

import SongViewSlides from "./SongViewSlides";
import { useSongViewSlides } from "./useSongViewSlides";

// Simple i18n mock that returns `defaultVal` when provided and supports `{{var}}` interpolation
vi.mock("react-i18next");

// Mock the slide hook so tests can provide deterministic slide state
vi.mock("./useSongViewSlides");
vi.mock("@/react/slide-orientation/SlideOrientationSelect");

const DEFAULT_SET_IS_FULLSCREEN = vi.fn();
const DEFAULT_VIEWPORT_ASPECT_WIDTH = 16;
const DEFAULT_VIEWPORT_ASPECT_HEIGHT = 9;
const DEFAULT_VIEWPORT_ASPECT_RATIO =
	DEFAULT_VIEWPORT_ASPECT_WIDTH / DEFAULT_VIEWPORT_ASPECT_HEIGHT;

// Minimal representative `SongPublic` used in tests.
const DUMMY_SONG: SongPublic = makeSongPublic({ song_slug: "my-slug" });

/**
 * Install a simple i18n mock and mock SlideOrientationSelect for tests.
 *
 * @returns void
 */
function installI18nMock(): void {
	mockUseTranslation();
	vi.mocked(SlideOrientationSelect).mockImplementation(() => (
		<select data-testid="slide-orientation-select" />
	));
}

describe("song view slides", () => {
	// Verifies nav controls and keyboard hint render when slides are available
	// Also checks fullscreen button is present
	it("renders controls and keyboard hint", () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockReturnValue({
			canPortalFullScreen: true,
			clampedIndex: 0,
			currentSlide: { slide_name: "Verse 1", field_data: { lyrics: "Hello" } },
			displayFields: ["lyrics"],
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			goFirst: mockGo,
			goLast: mockGo,
			goNext: mockGo,
			goPrev: mockGo,
			isFullScreen: false,
			selectedFields: ["lyrics"],
			setIsFullScreen: DEFAULT_SET_IS_FULLSCREEN,
			setChordDisplayMode: vi.fn(),
			showChords: true,
			showLanguageTags: false,
			slideContainerClassName: "mx-auto w-full max-w-5xl",
			toggleChords: vi.fn(),
			toggleField: vi.fn(),
			toggleLanguageTags: vi.fn(),
			totalSlides: 2,
			viewportAspectRatio: DEFAULT_VIEWPORT_ASPECT_RATIO,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		const { getByLabelText, getByTestId, getByText } = render(
			<SongViewSlides songPublic={DUMMY_SONG} />,
		);

		// main slide region
		expect(getByLabelText("Current slide")).toBeTruthy();

		// navigation controls
		expect(getByLabelText("Slide navigation")).toBeTruthy();

		// keyboard hint paragraph
		expect(
			getByText("Use First / Previous / Next / Last or ← → Home End to change slides."),
		).toBeTruthy();

		// full screen button is present
		expect(getByTestId("song-view-fullscreen")).toBeTruthy();
		expect(getByTestId("slide-orientation-select")).toBeTruthy();
		cleanup();
	});

	// Ensures fullscreen opens, shows exit UI, and can be closed
	// via the exit button.
	it("toggles fullscreen and exits via button", async () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockImplementation(() => {
			const [isFullScreen, setIsFullScreen] = useState(false);
			return {
				canPortalFullScreen: true,
				clampedIndex: 0,
				currentSlide: { slide_name: "Verse 1", field_data: { lyrics: "Hello" } },
				displayFields: ["lyrics"],
				effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
				goFirst: mockGo,
				goLast: mockGo,
				goNext: mockGo,
				goPrev: mockGo,
				isFullScreen,
				selectedFields: ["lyrics"],
				setIsFullScreen,
				setChordDisplayMode: vi.fn(),
				showChords: true,
				showLanguageTags: false,
				slideContainerClassName: "mx-auto w-full max-w-5xl",
				toggleChords: vi.fn(),
				toggleField: vi.fn(),
				toggleLanguageTags: vi.fn(),
				totalSlides: 2,
				viewportAspectRatio: DEFAULT_VIEWPORT_ASPECT_RATIO,
				chordDisplayMode: ChordDisplayMode.letters,
			};
		});

		const { getByTestId, getByText, queryByTestId } = render(
			<SongViewSlides songPublic={DUMMY_SONG} />,
		);

		// click full screen button
		const fsBtn = getByTestId("song-view-fullscreen");
		fireEvent.click(fsBtn);

		// full screen overlay should show exit button and hint
		expect(getByTestId("song-view-exit-fullscreen")).toBeTruthy();
		expect(getByText("Press Esc to exit")).toBeTruthy();
		expect(getByTestId("song-view-fullscreen-slide-frame").className).toBe("absolute inset-0");

		// clicking exit button closes fullscreen
		fireEvent.click(getByTestId("song-view-exit-fullscreen"));
		await waitFor(() => {
			expect(queryByTestId("song-view-exit-fullscreen")).toBeNull();
		});

		// reopen fullscreen
		fireEvent.click(getByTestId("song-view-fullscreen"));
		expect(getByTestId("song-view-exit-fullscreen")).toBeTruthy();
		cleanup();
	});

	// Confirms controls and keyboard hint are hidden when no slides exist
	// Verifies the 'No slides for this song.' message appears
	it("does not render controls or keyboard hint when there are no slides", () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockReturnValue({
			canPortalFullScreen: true,
			clampedIndex: 0,
			currentSlide: undefined,
			displayFields: [],
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			goFirst: mockGo,
			goLast: mockGo,
			goNext: mockGo,
			goPrev: mockGo,
			isFullScreen: false,
			selectedFields: [],
			setIsFullScreen: DEFAULT_SET_IS_FULLSCREEN,
			setChordDisplayMode: vi.fn(),
			showChords: true,
			showLanguageTags: false,
			slideContainerClassName: "mx-auto w-full max-w-5xl",
			toggleChords: vi.fn(),
			toggleField: vi.fn(),
			toggleLanguageTags: vi.fn(),
			totalSlides: 0,
			viewportAspectRatio: DEFAULT_VIEWPORT_ASPECT_RATIO,
			chordDisplayMode: ChordDisplayMode.letters,
		});

		const { queryByLabelText, queryByText, getByText } = render(
			<SongViewSlides songPublic={DUMMY_SONG} />,
		);

		// no navigation
		expect(queryByLabelText("Slide navigation")).toBeNull();

		// no keyboard hint
		expect(
			queryByText("Use First / Previous / Next / Last or ← → Home End to change slides."),
		).toBeNull();

		// current slide area should show the 'no slides' message
		expect(getByText("No slides for this song.")).toBeTruthy();
		cleanup();
	});
});
