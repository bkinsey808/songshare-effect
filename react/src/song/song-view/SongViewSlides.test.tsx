import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeSongPublic from "@/react/song/test-utils/makeSongPublic.mock";

import type { SongPublic } from "../song-schema";

import SongViewSlides from "./SongViewSlides";
import { useSongViewSlides } from "./useSongViewSlides";

// Simple i18n mock that returns `defaultVal` when provided and supports `{{var}}` interpolation
vi.mock("react-i18next");

// Mock the slide hook so tests can provide deterministic slide state
vi.mock("./useSongViewSlides");

// Minimal representative `SongPublic` used in tests.
const DUMMY_SONG: SongPublic = makeSongPublic({ song_slug: "my-slug" });

function translateWithInterpolation(
	key: string,
	defaultVal?: string | Record<string, unknown>,
	vars?: Record<string, unknown>,
): string {
	if (typeof defaultVal !== "string") {
		return key;
	}

	let output = defaultVal;
	if (vars !== undefined) {
		for (const [entryKey, entryVal] of Object.entries(vars)) {
			output = output.replaceAll(`{{ ${entryKey} }}`, String(entryVal));
			output = output.replaceAll(`{{${entryKey}}}`, String(entryVal));
		}
	}
	return output;
}

function installI18nMock(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: translateWithInterpolation,
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
}

describe("song view slides", () => {
	// Verifies nav controls and keyboard hint render when slides are available
	// Also checks fullscreen button is present
	it("renders controls and keyboard hint", () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockReturnValue({
			clampedIndex: 0,
			currentSlide: { slide_name: "Verse 1", field_data: { lyrics: "Hello" } },
			displayFields: ["lyrics"],
			goFirst: mockGo,
			goLast: mockGo,
			goNext: mockGo,
			goPrev: mockGo,
			totalSlides: 2,
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
		cleanup();
	});

	// Ensures fullscreen opens, shows exit UI, and can be closed
	// via the exit button or the Escape key
	it("toggles fullscreen and exits via button and Escape key", async () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockReturnValue({
			clampedIndex: 0,
			currentSlide: { slide_name: "Verse 1", field_data: { lyrics: "Hello" } },
			displayFields: ["lyrics"],
			goFirst: mockGo,
			goLast: mockGo,
			goNext: mockGo,
			goPrev: mockGo,
			totalSlides: 2,
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

		// clicking exit button closes fullscreen
		fireEvent.click(getByTestId("song-view-exit-fullscreen"));
		await waitFor(() => {
			expect(queryByTestId("song-view-exit-fullscreen")).toBeNull();
		});

		// reopen fullscreen
		fireEvent.click(getByTestId("song-view-fullscreen"));
		expect(getByTestId("song-view-exit-fullscreen")).toBeTruthy();

		// pressing Escape closes it
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
		await waitFor(() => {
			expect(queryByTestId("song-view-exit-fullscreen")).toBeNull();
		});
		cleanup();
	});

	// Confirms controls and keyboard hint are hidden when no slides exist
	// Verifies the 'No slides for this song.' message appears
	it("does not render controls or keyboard hint when there are no slides", () => {
		installI18nMock();
		const mockGo = vi.fn();
		vi.mocked(useSongViewSlides).mockReturnValue({
			clampedIndex: 0,
			currentSlide: undefined,
			displayFields: [],
			goFirst: mockGo,
			goLast: mockGo,
			goNext: mockGo,
			goPrev: mockGo,
			totalSlides: 0,
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
