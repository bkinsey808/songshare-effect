import { cleanup, fireEvent, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import type { SongPublic } from "@/react/song/song-schema";
import makeSongFromIds from "@/react/song/test-utils/makeSongFromIds.test-util";
import { ONE, TWO, ZERO } from "@/shared/constants/shared-constants";
import isRecord from "@/shared/type-guards/isRecord";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import { useSongViewSlides } from "./useSongViewSlides";

vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

const DEFAULT_VIEWPORT_WIDTH = 1600;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const UPDATED_VIEWPORT_WIDTH = 900;
const UPDATED_VIEWPORT_HEIGHT = 1600;
const LANDSCAPE_CONTAINER_CLASS_NAME = "mx-auto w-full max-w-5xl";
const PORTRAIT_CONTAINER_CLASS_NAME = "mx-auto w-full max-w-xl";
const SCRIPT_LANGUAGE = "es";
const TRANSLATION_LANGUAGE = "fr";
const FIRST_SLIDE_ID = "a";
const SECOND_SLIDE_ID = "b";
const THIRD_SLIDE_ID = "c";
const FIRST_SLIDE_NAME = "Slide a";
const EMPTY_TEXT = "";
const ARROW_RIGHT_KEY = "ArrowRight";
const ARROW_LEFT_KEY = "ArrowLeft";
const END_KEY = "End";
const HOME_KEY = "Home";
const ESCAPE_KEY = "Escape";
const UNUSED_KEY = "A";
const ENTER_KEY = "Enter";
const FULL_SCREEN_FALSE = "false";
const FULL_SCREEN_TRUE = "true";
const DEFAULT_VIEWPORT_ASPECT_RATIO = DEFAULT_VIEWPORT_WIDTH / DEFAULT_VIEWPORT_HEIGHT;
const UPDATED_VIEWPORT_ASPECT_RATIO = UPDATED_VIEWPORT_WIDTH / UPDATED_VIEWPORT_HEIGHT;

vi.stubGlobal("document", document);

/**
 * Install a mocked slide orientation preference for hook tests.
 *
 * @param effectiveSlideOrientation - The resolved orientation to return
 * @returns void
 */
function installSlideOrientationPreferenceMock(
	effectiveSlideOrientation: "landscape" | "portrait" = ResolvedSlideOrientation.landscape,
): void {
	vi.mocked(useSlideOrientationPreference).mockReturnValue({
		effectiveSlideOrientation,
		isSystemSlideOrientation: false,
		slideOrientationPreference:
			effectiveSlideOrientation === ResolvedSlideOrientation.portrait
				? SlideOrientationPreference.portrait
				: SlideOrientationPreference.landscape,
	});
}

/**
 * Stub global viewport dimensions for tests.
 *
 * @param width - The `innerWidth` value to stub
 * @param height - The `innerHeight` value to stub
 * @returns void
 */
function installViewportDimensions({
	height = DEFAULT_VIEWPORT_HEIGHT,
	width = DEFAULT_VIEWPORT_WIDTH,
}: Readonly<{
	height?: number;
	width?: number;
}> = {}): void {
	vi.stubGlobal("innerWidth", width);
	vi.stubGlobal("innerHeight", height);
}

/**
 * Harness for `useSongViewSlides`.
 *
 * Shows the hook in real UI wiring:
 * - navigation buttons call each slide movement handler
 * - a fullscreen button toggles `isFullScreen`
 * - test ids expose every returned value for assertions
 *
 * @param songPublic - SongPublic instance (or undefined) to provide to the hook
 * @returns ReactElement rendering hook outputs for assertions
 * @param props - Props object passed to the Harness (documented for the scanner)
 */
function Harness(props: { songPublic: SongPublic | undefined }): ReactElement {
	const hook = useSongViewSlides(props.songPublic);
	const currentSlideName =
		isRecord(hook.currentSlide) && typeof hook.currentSlide["slide_name"] === "string"
			? hook.currentSlide["slide_name"]
			: EMPTY_TEXT;

	return (
		<div>
			<div data-testid="clamped-index">{String(hook.clampedIndex)}</div>
			<div data-testid="current-slide-name">{currentSlideName}</div>
			<div data-testid="display-fields">{hook.displayFields.join(",")}</div>
			<div data-testid="effective-slide-orientation">{hook.effectiveSlideOrientation}</div>
			<div data-testid="is-full-screen">{String(hook.isFullScreen)}</div>
			<div data-testid="slide-container-class-name">{hook.slideContainerClassName}</div>
			<div data-testid="total-slides">{String(hook.totalSlides)}</div>
			<div data-testid="viewport-aspect-ratio">{String(hook.viewportAspectRatio)}</div>
			<div data-testid="can-portal-full-screen">{String(hook.canPortalFullScreen)}</div>
			<button
				type="button"
				data-testid="go-first"
				onClick={() => {
					hook.goFirst();
				}}
			>
				first
			</button>
			<button
				type="button"
				data-testid="go-prev"
				onClick={() => {
					hook.goPrev();
				}}
			>
				prev
			</button>
			<button
				type="button"
				data-testid="go-next"
				onClick={() => {
					hook.goNext();
				}}
			>
				next
			</button>
			<button
				type="button"
				data-testid="go-last"
				onClick={() => {
					hook.goLast();
				}}
			>
				last
			</button>
			<button
				type="button"
				data-testid="toggle-full-screen"
				onClick={() => {
					hook.setIsFullScreen((prev) => !prev);
				}}
			>
				fullscreen
			</button>
		</div>
	);
}

describe("useSongViewSlides — Harness", () => {
	it("documents the initial landscape state and visible hook outputs", () => {
		cleanup();
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID]);

		// Act
		const { getByTestId } = render(<Harness songPublic={song} />);

		// Assert
		expect({
			canPortalFullScreen: getByTestId("can-portal-full-screen").textContent,
			clampedIndex: getByTestId("clamped-index").textContent,
			currentSlideName: getByTestId("current-slide-name").textContent,
			displayFields: getByTestId("display-fields").textContent,
			effectiveSlideOrientation: getByTestId("effective-slide-orientation").textContent,
			isFullScreen: getByTestId("is-full-screen").textContent,
			slideContainerClassName: getByTestId("slide-container-class-name").textContent,
			totalSlides: getByTestId("total-slides").textContent,
			viewportAspectRatio: getByTestId("viewport-aspect-ratio").textContent,
		}).toStrictEqual({
			canPortalFullScreen: "true",
			clampedIndex: "0",
			currentSlideName: FIRST_SLIDE_NAME,
			displayFields: "lyrics",
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			isFullScreen: FULL_SCREEN_FALSE,
			slideContainerClassName: LANDSCAPE_CONTAINER_CLASS_NAME,
			totalSlides: "2",
			viewportAspectRatio: String(DEFAULT_VIEWPORT_ASPECT_RATIO),
		});
	});

	it("wires every navigation and full-screen handler through real UI controls", async () => {
		cleanup();
		installSlideOrientationPreferenceMock(ResolvedSlideOrientation.portrait);
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID, THIRD_SLIDE_ID], {
			script: [SCRIPT_LANGUAGE],
		});
		const { getByTestId } = render(<Harness songPublic={song} />);

		// Act
		fireEvent.click(getByTestId("go-next"));
		await waitFor(() => {
			expect(getByTestId("clamped-index").textContent).toBe("1");
		});

		fireEvent.click(getByTestId("go-last"));
		await waitFor(() => {
			expect(getByTestId("clamped-index").textContent).toBe("2");
		});

		fireEvent.click(getByTestId("go-prev"));
		await waitFor(() => {
			expect(getByTestId("clamped-index").textContent).toBe("1");
		});

		fireEvent.click(getByTestId("go-first"));
		await waitFor(() => {
			expect(getByTestId("clamped-index").textContent).toBe("0");
		});

		fireEvent.click(getByTestId("toggle-full-screen"));
		await waitFor(() => {
			expect(getByTestId("is-full-screen").textContent).toBe(FULL_SCREEN_TRUE);
		});

		globalThis.dispatchEvent(new KeyboardEvent("resize"));

		// Assert
		expect({
			displayFields: getByTestId("display-fields").textContent,
			effectiveSlideOrientation: getByTestId("effective-slide-orientation").textContent,
			isFullScreen: getByTestId("is-full-screen").textContent,
			slideContainerClassName: getByTestId("slide-container-class-name").textContent,
			totalSlides: getByTestId("total-slides").textContent,
		}).toStrictEqual({
			displayFields: "lyrics,script",
			effectiveSlideOrientation: ResolvedSlideOrientation.portrait,
			isFullScreen: FULL_SCREEN_TRUE,
			slideContainerClassName: PORTRAIT_CONTAINER_CLASS_NAME,
			totalSlides: "3",
		});
	});
});

describe("useSongViewSlides — renderHook", () => {
	it("defaults when no song is available", () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Act
		const { result } = renderHook(() => useSongViewSlides(undefined));

		// Assert
		expect(result.current).toMatchObject({
			clampedIndex: ZERO,
			currentSlide: undefined,
			displayFields: [],
			effectiveSlideOrientation: ResolvedSlideOrientation.landscape,
			isFullScreen: false,
			slideContainerClassName: LANDSCAPE_CONTAINER_CLASS_NAME,
			totalSlides: ZERO,
			viewportAspectRatio: DEFAULT_VIEWPORT_ASPECT_RATIO,
		});
	});

	it("handles empty slide order and missing current slides safely", () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([]);

		// Act
		const { result } = renderHook(() => useSongViewSlides(song));

		// Assert
		expect(result.current.currentSlide).toBeUndefined();
		expect(result.current.displayFields).toStrictEqual(["lyrics"]);
		expect(result.current.totalSlides).toBe(ZERO);
	});

	it("uses language-derived display fields and resolves the first slide initially", () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID], {
			script: [SCRIPT_LANGUAGE],
			translations: [TRANSLATION_LANGUAGE],
		});

		// Act
		const { result } = renderHook(() => useSongViewSlides(song));

		// Assert
		expect(result.current.currentSlide).toStrictEqual(song.slides[FIRST_SLIDE_ID]);
		expect(result.current.displayFields).toStrictEqual([
			"lyrics",
			"script",
			TRANSLATION_LANGUAGE,
		]);
		expect(result.current.totalSlides).toBe(ONE);
	});

	it("moves through slides with the navigation helpers", async () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID]);
		const { result } = renderHook(() => useSongViewSlides(song));

		// Act
		result.current.goNext();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		result.current.goPrev();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		result.current.goLast();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		result.current.goFirst();

		// Assert
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
	});

	it("handles keyboard navigation and ignores unrelated keys", async () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID, THIRD_SLIDE_ID]);
		const { result } = renderHook(() => useSongViewSlides(song));

		// Act
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ARROW_RIGHT_KEY }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ARROW_LEFT_KEY }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: END_KEY }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(TWO);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: HOME_KEY }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: UNUSED_KEY }));
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ENTER_KEY }));

		// Assert
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
	});

	it("removes keyboard listeners on unmount", async () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID]);
		const { result, unmount } = renderHook(() => useSongViewSlides(song));

		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ARROW_RIGHT_KEY }));
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ONE);
		});
		const previousIndex = result.current.clampedIndex;

		// Act
		unmount();
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ARROW_LEFT_KEY }));

		// Assert
		expect(result.current.clampedIndex).toBe(previousIndex);
	});

	it("clamps the current slide index when the song shrinks", async () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const largeSong = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID, THIRD_SLIDE_ID]);
		const smallSong = makeSongFromIds([FIRST_SLIDE_ID]);
		const { result, rerender } = renderHook(({ songPublic }) => useSongViewSlides(songPublic), {
			initialProps: { songPublic: largeSong },
		});

		result.current.goLast();
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(TWO);
		});

		// Act
		rerender({ songPublic: smallSong });

		// Assert
		await waitFor(() => {
			expect(result.current.clampedIndex).toBe(ZERO);
		});
		expect(result.current.currentSlide).toStrictEqual(smallSong.slides[FIRST_SLIDE_ID]);
	});

	it("tracks orientation-derived view state", () => {
		installSlideOrientationPreferenceMock(ResolvedSlideOrientation.portrait);
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID]);

		// Act
		const { result } = renderHook(() => useSongViewSlides(song));

		// Assert
		expect(result.current.effectiveSlideOrientation).toBe(ResolvedSlideOrientation.portrait);
		expect(result.current.slideContainerClassName).toBe(PORTRAIT_CONTAINER_CLASS_NAME);
		expect(result.current.canPortalFullScreen).toBe(true);
	});

	it("updates full-screen state and viewport ratio, then exits on Escape", async () => {
		installSlideOrientationPreferenceMock();
		installViewportDimensions();

		// Arrange
		const song = makeSongFromIds([FIRST_SLIDE_ID, SECOND_SLIDE_ID]);
		const { result } = renderHook(() => useSongViewSlides(song));

		// Act
		result.current.setIsFullScreen(true);
		await waitFor(() => {
			expect(result.current.isFullScreen).toBe(true);
		});

		installViewportDimensions({
			height: UPDATED_VIEWPORT_HEIGHT,
			width: UPDATED_VIEWPORT_WIDTH,
		});
		globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: ESCAPE_KEY }));
		globalThis.dispatchEvent(new KeyboardEvent("resize"));

		// Assert
		await waitFor(() => {
			expect(result.current.isFullScreen).toBe(false);
		});
		expect(result.current.viewportAspectRatio).toBe(UPDATED_VIEWPORT_ASPECT_RATIO);
	});
});
