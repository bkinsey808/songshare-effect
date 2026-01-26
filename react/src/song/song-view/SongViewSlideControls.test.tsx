import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SongViewSlideControls from "./SongViewSlideControls";

// Helper constant for asserting a single handler invocation.
const CALLED_ONCE = 1;

// Lightweight i18n mock used by tests.
//
// Returns the provided `defaultVal` when present so test strings remain readable
// (e.g. "Slide 1 of 5"). Also supports simple interpolation using
// `{{ var }}` and `{{var}}` forms so templates behave like the real i18n.
vi.mock(
	"react-i18next",
	(): {
		useTranslation: () => {
			t: (
				key: string,
				defaultVal?: string | Record<string, unknown>,
				vars?: Record<string, unknown>,
			) => string;
			i18n: { language: string };
		};
	} => ({
		useTranslation(): {
			t: (
				key: string,
				defaultVal?: string | Record<string, unknown>,
				vars?: Record<string, unknown>,
			) => string;
			i18n: { language: string };
		} {
			return {
				t: (
					key: string,
					defaultVal?: string | Record<string, unknown>,
					vars?: Record<string, unknown>,
				): string => {
					if (typeof defaultVal === "string") {
						let out = defaultVal;
						if (vars && typeof vars === "object") {
							for (const [entryKey, entryVal] of Object.entries(vars)) {
								out = out.replaceAll(`{{ ${entryKey} }}`, String(entryVal));
								out = out.replaceAll(`{{${entryKey}}}`, String(entryVal));
							}
						}
						return out;
					}
					return key;
				},
				i18n: { language: "en" },
			};
		},
	}),
);

// Test suite for `SongViewSlideControls`.
//
// Verifies rendering, accessibility labels, enabled/disabled button states,
// click behavior, and fullscreen control visibility.
describe("songViewSlideControls", () => {
	// When there are no slides the controls should not render at all.
	it("renders nothing when totalSlides is 0", () => {
		render(
			<SongViewSlideControls
				clampedIndex={0}
				goFirst={vi.fn()}
				goLast={vi.fn()}
				goNext={vi.fn()}
				goPrev={vi.fn()}
				totalSlides={0}
			/>,
		);

		expect(screen.queryByTestId("song-view-first")).toBeNull();
	});

	// At the first slide the counter must display "Slide 1 of N" and
	// the first/prev buttons must be disabled while next/last are enabled.
	it("shows counter and proper enabled/disabled states at first slide", () => {
		const goFirst = vi.fn();
		const goPrev = vi.fn();
		const goNext = vi.fn();
		const goLast = vi.fn();

		render(
			<SongViewSlideControls
				clampedIndex={0}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				totalSlides={5}
			/>,
		);

		expect(screen.getByText("Slide 1 of 5")).toBeTruthy();

		const first = screen.getByTestId("song-view-first");
		const prev = screen.getByTestId("song-view-prev");
		const next = screen.getByTestId("song-view-next");
		const last = screen.getByTestId("song-view-last");

		expect(first.hasAttribute("disabled")).toBe(true);
		expect(prev.hasAttribute("disabled")).toBe(true);
		expect(next.hasAttribute("disabled")).toBe(false);
		expect(last.hasAttribute("disabled")).toBe(false);

		cleanup();
	});

	// Ensure disabled buttons don't call their handlers while enabled ones do.
	it("click behavior: disabled buttons don't call and enabled buttons do", () => {
		const goFirst = vi.fn();
		const goPrev = vi.fn();
		const goNext = vi.fn();
		const goLast = vi.fn();

		render(
			<SongViewSlideControls
				clampedIndex={0}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				totalSlides={5}
			/>,
		);

		const first = screen.getByTestId("song-view-first");
		const prev = screen.getByTestId("song-view-prev");
		const next = screen.getByTestId("song-view-next");
		const last = screen.getByTestId("song-view-last");

		fireEvent.click(first);
		fireEvent.click(prev);
		expect(goFirst).not.toHaveBeenCalled();
		expect(goPrev).not.toHaveBeenCalled();

		fireEvent.click(next);
		fireEvent.click(last);
		expect(goNext).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(goLast).toHaveBeenCalledTimes(CALLED_ONCE);
		cleanup();
	});

	// At the last slide next/last should be disabled; prev/first should be usable.
	it("disables next/last at final slide and prev/first work", () => {
		const goFirst = vi.fn();
		const goPrev = vi.fn();
		const goNext = vi.fn();
		const goLast = vi.fn();

		render(
			<SongViewSlideControls
				clampedIndex={4}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				totalSlides={5}
			/>,
		);

		const first = screen.getByTestId("song-view-first");
		const prev = screen.getByTestId("song-view-prev");
		const next = screen.getByTestId("song-view-next");
		const last = screen.getByTestId("song-view-last");

		expect(first.hasAttribute("disabled")).toBe(false);
		expect(prev.hasAttribute("disabled")).toBe(false);
		expect(next.hasAttribute("disabled")).toBe(true);
		expect(last.hasAttribute("disabled")).toBe(true);

		fireEvent.click(prev);
		expect(goPrev).toHaveBeenCalledTimes(CALLED_ONCE);
		cleanup();
	});

	// Fullscreen button is omitted when no handler is provided; ensure accessible label exists.
	it("does not render fullscreen button when handler omitted and has aria-label", () => {
		const goFirst = vi.fn();
		const goPrev = vi.fn();
		const goNext = vi.fn();
		const goLast = vi.fn();

		render(
			<SongViewSlideControls
				clampedIndex={2}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				totalSlides={4}
			/>,
		);

		expect(screen.queryByTestId("song-view-fullscreen")).toBeNull();
		expect(screen.getByLabelText("Slide navigation")).toBeTruthy();
		cleanup();
	});

	// When a fullscreen toggle handler is passed the button should appear and
	// respect `isFullScreen` (disabled when already fullscreen).
	it("fullscreen button appears only when handler provided and respects isFullScreen", () => {
		const onToggle = vi.fn();
		const goFirst = vi.fn();
		const goPrev = vi.fn();
		const goNext = vi.fn();
		const goLast = vi.fn();

		render(
			<SongViewSlideControls
				clampedIndex={1}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				isFullScreen={false}
				onToggleFullScreen={onToggle}
				totalSlides={3}
			/>,
		);

		const fs = screen.getByTestId("song-view-fullscreen");
		expect(fs).toBeTruthy();
		expect(fs.hasAttribute("disabled")).toBe(false);
		fireEvent.click(fs);
		expect(onToggle).toHaveBeenCalledTimes(CALLED_ONCE);

		// rerender with isFullScreen true
		vi.clearAllMocks();
		cleanup();
		render(
			<SongViewSlideControls
				clampedIndex={1}
				goFirst={goFirst}
				goLast={goLast}
				goNext={goNext}
				goPrev={goPrev}
				isFullScreen
				onToggleFullScreen={onToggle}
				totalSlides={3}
			/>,
		);

		const fs2 = screen.getByTestId("song-view-fullscreen");
		expect(fs2.hasAttribute("disabled")).toBe(true);
		fireEvent.click(fs2);
		expect(onToggle).not.toHaveBeenCalled();
		cleanup();
	});
});
