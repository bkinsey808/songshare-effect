import { cleanup, render, renderHook, within } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import forceCast from "@/react/lib/test-utils/forceCast";
import useSlideNumberPreference from "@/react/slide-number/useSlideNumberPreference";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import useSongViewCurrentSlide from "./useSongViewCurrentSlide";

vi.mock("react-i18next");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");
vi.mock("@/react/slide-number/useSlideNumberPreference");
vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

const FIRST_SLIDE_INDEX = 0;
const SINGLE_SLIDE_TOTAL = 1;
const ZERO_SLIDES = 0;
const FOCAL_POINT_X = 20;
const FOCAL_POINT_Y = 80;
const SLIDE_NAME = "Verse";
const LYRICS_TEXT = "Hello";
const LYRICS_FIELD = "lyrics";
const USER_ID = "user-1";
const IMAGE_ID = "img-1";
const IMAGE_URL = "https://cdn.example.com/image.png";
const ISO_DATE = "2026-03-30T00:00:00.000Z";
const IMAGE_NAME = "Background";
const IMAGE_SLUG = "background";
const IMAGE_KEY = "images/u1/img-1.png";
const IMAGE_CONTENT_TYPE = "image/png";
const IMAGE_FILE_SIZE = 123;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;
const TRUE_TEXT = "true";
const FALSE_TEXT = "false";
const EMPTY_TEXT = "";
const ROOT_CLASS_NAME = "aspect-[9/16]";
const ZERO_NUMBER = 0;

function installI18nMock(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: (_key: string, fallback?: string) => fallback ?? EMPTY_TEXT,
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
}

function installSlideOrientationMock(
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

function installSlideNumberPreferenceMock(showSlideNumber = false): void {
	vi.mocked(useSlideNumberPreference).mockReturnValue({
		showSlideNumber,
		slideNumberPreference: showSlideNumber ? "show" : "hide",
	});
}

function installChordDisplayModeMock(chordDisplayMode: "letters" | "german" | "indian" | "roman" | "solfege" = "letters"): void {
	vi.mocked(useChordDisplayModePreference).mockReturnValue({
		chordDisplayMode,
	});
}

function installAppStoreMock({
	imageLibraryEntries = {},
	publicImages = {},
}: Partial<Pick<AppSlice, "imageLibraryEntries" | "publicImages">> = {}): void {
	vi.mocked(useAppStore).mockImplementation(
		(selector: (state: AppSlice) => unknown) =>
			selector(
				forceCast<AppSlice>({
					imageLibraryEntries,
					publicImages,
				}),
			),
	);
}

function makeCurrentSlide(): {
	slide_name: string;
	field_data: Record<string, string>;
	background_image_id: string;
	background_image_url: string;
	background_image_width?: number;
	background_image_height?: number;
	background_image_focal_point_x?: number;
	background_image_focal_point_y?: number;
} {
	return {
		slide_name: SLIDE_NAME,
		field_data: { [LYRICS_FIELD]: LYRICS_TEXT },
		background_image_id: IMAGE_ID,
		background_image_url: IMAGE_URL,
	};
}

function makeImageLibraryEntry(): AppSlice["imageLibraryEntries"][string] {
	return forceCast<AppSlice["imageLibraryEntries"][string]>({
		image_id: IMAGE_ID,
		user_id: USER_ID,
		created_at: ISO_DATE,
		image_public: {
			image_id: IMAGE_ID,
			user_id: USER_ID,
			image_name: IMAGE_NAME,
			image_slug: IMAGE_SLUG,
			description: EMPTY_TEXT,
			alt_text: EMPTY_TEXT,
			r2_key: IMAGE_KEY,
			content_type: IMAGE_CONTENT_TYPE,
			file_size: IMAGE_FILE_SIZE,
			width: IMAGE_WIDTH,
			height: IMAGE_HEIGHT,
			created_at: ISO_DATE,
			updated_at: ISO_DATE,
			focal_point_x: FOCAL_POINT_X,
			focal_point_y: FOCAL_POINT_Y,
		},
	});
}

/**
 * Harness for useSongViewCurrentSlide.
 *
 * Shows how the hook integrates into the current slide UI:
 * - slide empty/renderable flags exposed as text
 * - slide name, field label, and field text rendered for a configured field
 * - computed aspect class, text styling, and slide style surfaced for assertions
 * - slide-number preference exposed as text for UI wiring
 */
function Harness({
	currentSlide,
	totalSlides,
}: {
	currentSlide: unknown;
	totalSlides: number;
}): ReactElement {
	const hook = useSongViewCurrentSlide({ currentSlide, totalSlides });

	return (
		<div data-testid="harness-root" className={hook.slideAspectClassName}>
			<div data-testid="is-empty">{String(hook.isEmpty)}</div>
			<div data-testid="is-renderable">{String(hook.isRenderable)}</div>
			<div data-testid="show-slide-number">{String(hook.showSlideNumber)}</div>
			<div data-testid="slide-name">{hook.slideNameStr}</div>
			<div data-testid="background-image-url">{hook.backgroundImageUrl ?? EMPTY_TEXT}</div>
			<div data-testid="image-width">{String(hook.backgroundImageDimensions?.width ?? EMPTY_TEXT)}</div>
			<div data-testid="image-height">{String(hook.backgroundImageDimensions?.height ?? EMPTY_TEXT)}</div>
			<div data-testid="effective-orientation">{hook.effectiveSlideOrientation}</div>
			<div data-testid="focal-point-x">{String(hook.focalPoint?.focal_point_x ?? EMPTY_TEXT)}</div>
			<div data-testid="focal-point-y">{String(hook.focalPoint?.focal_point_y ?? EMPTY_TEXT)}</div>
			<div data-testid="field-label">{hook.getFieldLabel(LYRICS_FIELD)}</div>
			<div data-testid="field-text">{hook.getFieldText(LYRICS_FIELD)}</div>
		</div>
	);
}

describe("useSongViewCurrentSlide — Harness", () => {
	it("renders the current slide view state with focal-point data", () => {
		cleanup();
		installI18nMock();
		installAppStoreMock({
			imageLibraryEntries: {
				[IMAGE_ID]: makeImageLibraryEntry(),
			},
		});
		installChordDisplayModeMock();
		installSlideOrientationMock(ResolvedSlideOrientation.portrait);
		installSlideNumberPreferenceMock(true);

		const { container } = render(
			<Harness currentSlide={makeCurrentSlide()} totalSlides={SINGLE_SLIDE_TOTAL} />,
		);

		const harnessValues = {
			isEmpty: forceCast<HTMLElement>(within(container).getByTestId("is-empty")).textContent,
			isRenderable: forceCast<HTMLElement>(within(container).getByTestId("is-renderable")).textContent,
			showSlideNumber: forceCast<HTMLElement>(
				within(container).getByTestId("show-slide-number"),
			).textContent,
			slideName: forceCast<HTMLElement>(within(container).getByTestId("slide-name")).textContent,
			backgroundImageUrl: forceCast<HTMLElement>(
				within(container).getByTestId("background-image-url"),
			).textContent,
			imageWidth: forceCast<HTMLElement>(within(container).getByTestId("image-width")).textContent,
			imageHeight: forceCast<HTMLElement>(within(container).getByTestId("image-height")).textContent,
			fieldLabel: forceCast<HTMLElement>(within(container).getByTestId("field-label")).textContent,
			fieldText: forceCast<HTMLElement>(within(container).getByTestId("field-text")).textContent,
			effectiveOrientation: forceCast<HTMLElement>(
				within(container).getByTestId("effective-orientation"),
			).textContent,
			focalPointX: forceCast<HTMLElement>(within(container).getByTestId("focal-point-x")).textContent,
			focalPointY: forceCast<HTMLElement>(within(container).getByTestId("focal-point-y")).textContent,
		};
		expect(harnessValues).toStrictEqual({
			isEmpty: FALSE_TEXT,
			isRenderable: TRUE_TEXT,
			showSlideNumber: TRUE_TEXT,
			slideName: SLIDE_NAME,
			backgroundImageUrl: IMAGE_URL,
			imageWidth: String(IMAGE_WIDTH),
			imageHeight: String(IMAGE_HEIGHT),
			fieldLabel: LYRICS_FIELD,
			fieldText: LYRICS_TEXT,
			effectiveOrientation: ResolvedSlideOrientation.portrait,
			focalPointX: String(FOCAL_POINT_X),
			focalPointY: String(FOCAL_POINT_Y),
		});

		const root = forceCast<HTMLElement>(within(container).getByTestId("harness-root"));
		expect(root.className).toContain(ROOT_CLASS_NAME);
	});
});

describe("useSongViewCurrentSlide — renderHook", () => {
	it("returns an empty-state result when there are no slides", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({ currentSlide: undefined, totalSlides: ZERO_SLIDES }),
		);

		expect(result.current).toMatchObject({
			backgroundImageDimensions: undefined,
			backgroundImageUrl: undefined,
			focalPoint: undefined,
			isEmpty: true,
			isRenderable: false,
			slideNameStr: EMPTY_TEXT,
		});
		expect(result.current.getFieldText(LYRICS_FIELD)).toBe(EMPTY_TEXT);
	});

	it("leaves focalPoint undefined when focal-point metadata is unavailable", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock(ResolvedSlideOrientation.portrait);
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({ currentSlide: makeCurrentSlide(), totalSlides: SINGLE_SLIDE_TOTAL }),
		);

		expect(result.current.effectiveSlideOrientation).toBe(ResolvedSlideOrientation.portrait);
		expect(result.current.backgroundImageDimensions).toBeUndefined();
		expect(result.current.focalPoint).toBeUndefined();
	});

	it("reads focal point from publicImages when the library entry is absent", () => {
		installI18nMock();
		installAppStoreMock({
			publicImages: {
				[IMAGE_ID]: forceCast<AppSlice["publicImages"][string]>(makeImageLibraryEntry().image_public),
			},
		});
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({ currentSlide: makeCurrentSlide(), totalSlides: SINGLE_SLIDE_TOTAL }),
		);

		expect(result.current.backgroundImageDimensions).toStrictEqual({
			width: IMAGE_WIDTH,
			height: IMAGE_HEIGHT,
		});
		expect(result.current.focalPoint).toStrictEqual({
			focal_point_x: FOCAL_POINT_X,
			focal_point_y: FOCAL_POINT_Y,
		});
		expect(result.current.showSlideNumber).toBe(false);
		expect(result.current.slideAspectClassName).toBe("aspect-video");
		expect(result.current.getFieldLabel(LYRICS_FIELD)).toBe(LYRICS_FIELD);
	});

	it("prefers focal point and dimensions from the slide payload", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({
				currentSlide: {
					...makeCurrentSlide(),
					background_image_width: IMAGE_WIDTH,
					background_image_height: IMAGE_HEIGHT,
					background_image_focal_point_x: FOCAL_POINT_X,
					background_image_focal_point_y: FOCAL_POINT_Y,
				},
				totalSlides: SINGLE_SLIDE_TOTAL,
			}),
		);

		expect(result.current.backgroundImageDimensions).toStrictEqual({
			width: IMAGE_WIDTH,
			height: IMAGE_HEIGHT,
		});
		expect(result.current.focalPoint).toStrictEqual({
			focal_point_x: FOCAL_POINT_X,
			focal_point_y: FOCAL_POINT_Y,
		});
	});

	it("returns empty strings for missing slide text fields", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({
				currentSlide: {
					slide_name: 123,
					field_data: { [LYRICS_FIELD]: 456 },
				},
				totalSlides: SINGLE_SLIDE_TOTAL,
			}),
		);

		expect(result.current.isRenderable).toBe(true);
		expect(result.current.slideNameStr).toBe(EMPTY_TEXT);
		expect(result.current.getFieldText(LYRICS_FIELD)).toBe(EMPTY_TEXT);
	});

	it("preserves the configured slide number preference", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock(true);

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({
				currentSlide: makeCurrentSlide(),
				totalSlides: SINGLE_SLIDE_TOTAL,
			}),
		);

		expect(result.current.showSlideNumber).toBe(true);
		expect(result.current.backgroundImageUrl).toBe(IMAGE_URL);
		expect(result.current.effectiveSlideOrientation).toBe(ResolvedSlideOrientation.landscape);
		expect(result.current.slideAspectClassName).toBe("aspect-video");
		expect(FIRST_SLIDE_INDEX).toBe(ZERO_NUMBER);
	});

	it("transforms lyric chord tokens according to the selected display mode", () => {
		installI18nMock();
		installAppStoreMock();
		installChordDisplayModeMock("roman");
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { result } = renderHook(() =>
			useSongViewCurrentSlide({
				currentSlide: {
					slide_name: SLIDE_NAME,
					field_data: {
						[LYRICS_FIELD]: "Line [C -] line [G 7]",
					},
				},
				songKey: "C",
				totalSlides: SINGLE_SLIDE_TOTAL,
			}),
		);

		expect(result.current.getFieldText(LYRICS_FIELD)).toBe("Line [I -] line [V 7]");
	});
});
