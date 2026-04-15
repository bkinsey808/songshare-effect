import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import useAppStore from "@/react/app-store/useAppStore";
import useChordDisplayModePreference from "@/react/chord-display-mode/useChordDisplayModePreference";
import forceCast from "@/react/lib/test-utils/forceCast";
import mockUseTranslation from "@/react/lib/test-utils/mockUseTranslation";
import useSlideNumberPreference from "@/react/slide-number/useSlideNumberPreference";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import SongViewCurrentSlide from "./SongViewCurrentSlide";

vi.mock("react-i18next");
vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/chord-display-mode/useChordDisplayModePreference");
vi.mock("@/react/slide-number/useSlideNumberPreference");
vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

const EXACT_IMAGE_LEFT = "-3.33%";
const EXACT_IMAGE_TOP = "0%";
const EXACT_IMAGE_WIDTH = "266.67%";
const EXACT_IMAGE_HEIGHT = "100%";
const LANDSCAPE_IMAGE_LEFT = "0%";
const LANDSCAPE_IMAGE_TOP = "-9.26%";
const LANDSCAPE_IMAGE_WIDTH = "100%";
const LANDSCAPE_IMAGE_HEIGHT = "118.52%";
const LANDSCAPE_FOCAL_POINT_X = 20;
const LANDSCAPE_FOCAL_POINT_Y = 50;

/**
 * Install a mocked slide orientation preference for SongViewCurrentSlide tests.
 *
 * @param effectiveSlideOrientation - The resolved orientation to return
 * @returns void
 */
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

/**
 * Install a mocked slide-number preference for SongViewCurrentSlide tests.
 *
 * @param showSlideNumber - Whether slide numbers should be shown
 * @returns void
 */
function installSlideNumberPreferenceMock(showSlideNumber = false): void {
	vi.mocked(useSlideNumberPreference).mockReturnValue({
		showSlideNumber,
		slideNumberPreference: showSlideNumber ? "show" : "hide",
	});
}

/**
 * Install a mocked chord display mode preference for SongViewCurrentSlide tests.
 *
 * @param chordDisplayMode - The chord display mode to expose
 * @returns void
 */
function installChordDisplayModeMock(
	chordDisplayMode: "letters" | "german" | "roman" | "sargam" | "solfege" = "letters",
): void {
	vi.mocked(useChordDisplayModePreference).mockReturnValue({
		chordDisplayCategory: "letters",
		chordLetterDisplay: "standard",
		chordDisplayMode,
		chordScaleDegreeDisplay: "roman",
	});
}

/**
 * Install a mocked `useAppStore` selector returning image-related state.
 *
 * @param imageLibraryEntries - Map of image library entries to expose
 * @param publicImages - Map of public images to expose
 * @returns void
 */
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

describe("song view current slide", () => {
	it("renders a background image element when slide has background_image_url", () => {
		mockUseTranslation();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
					background_image_url: "https://cdn.example.com/image.png",
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const image = getByTestId("song-current-slide-image");
		expect(image.getAttribute("src")).toBe("https://cdn.example.com/image.png");
		expect(image.className).toContain("object-cover");
	});

	it("does not render a background image style when background is missing", () => {
		mockUseTranslation();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const slide = getByTestId("song-current-slide");
		expect(slide.getAttribute("style")).toBe("aspect-ratio: 16 / 9;");
	});

	it("uses a portrait aspect ratio when portrait orientation is active", () => {
		mockUseTranslation();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock(ResolvedSlideOrientation.portrait);
		installSlideNumberPreferenceMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const slide = getByTestId("song-current-slide");
		expect(slide.classList.contains("aspect-[9/16]")).toBe(true);
		expect(slide.getAttribute("style")).toContain("aspect-ratio: 9 / 16");
	});

	it("renders the slide number without parentheses", () => {
		mockUseTranslation();
		installAppStoreMock();
		installChordDisplayModeMock();
		installSlideOrientationMock();
		installSlideNumberPreferenceMock(true);

		render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		expect(screen.getByText("1/1")).toBeTruthy();
		expect(screen.queryByText("(1/1)")).toBeNull();
	});

	it("centers the focal point exactly when image dimensions are available", () => {
		mockUseTranslation();
		installAppStoreMock({
			imageLibraryEntries: {
				"img-1": forceCast<AppSlice["imageLibraryEntries"][string]>({
					image_id: "img-1",
					user_id: "user-1",
					created_at: "2026-03-30T00:00:00.000Z",
					image_public: {
						image_id: "img-1",
						user_id: "user-1",
						image_name: "Background",
						image_slug: "background",
						description: "",
						alt_text: "",
						r2_key: "images/u1/img-1.png",
						content_type: "image/png",
						file_size: 123,
						width: 1200,
						height: 800,
						created_at: "2026-03-30T00:00:00.000Z",
						updated_at: "2026-03-30T00:00:00.000Z",
						focal_point_x: LANDSCAPE_FOCAL_POINT_X,
						focal_point_y: LANDSCAPE_FOCAL_POINT_Y,
					},
				}),
			},
		});
		installChordDisplayModeMock();
		installSlideOrientationMock(ResolvedSlideOrientation.portrait);
		installSlideNumberPreferenceMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
					background_image_id: "img-1",
					background_image_url: "https://cdn.example.com/image.png",
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const image = getByTestId("song-current-slide-image");
		expect(image.getAttribute("style")).toContain(`left: ${EXACT_IMAGE_LEFT}`);
		expect(image.getAttribute("style")).toContain(`top: ${EXACT_IMAGE_TOP}`);
		expect(image.getAttribute("style")).toContain(`width: ${EXACT_IMAGE_WIDTH}`);
		expect(image.getAttribute("style")).toContain(`height: ${EXACT_IMAGE_HEIGHT}`);
	});

	it("centers the focal point vertically in landscape when image dimensions are available", () => {
		mockUseTranslation();
		installAppStoreMock({
			imageLibraryEntries: {
				"img-1": forceCast<AppSlice["imageLibraryEntries"][string]>({
					image_id: "img-1",
					user_id: "user-1",
					created_at: "2026-03-30T00:00:00.000Z",
					image_public: {
						image_id: "img-1",
						user_id: "user-1",
						image_name: "Background",
						image_slug: "background",
						description: "",
						alt_text: "",
						r2_key: "images/u1/img-1.png",
						content_type: "image/png",
						file_size: 123,
						width: 1200,
						height: 800,
						created_at: "2026-03-30T00:00:00.000Z",
						updated_at: "2026-03-30T00:00:00.000Z",
						focal_point_x: LANDSCAPE_FOCAL_POINT_X,
						focal_point_y: LANDSCAPE_FOCAL_POINT_Y,
					},
				}),
			},
		});
		installChordDisplayModeMock();
		installSlideOrientationMock(ResolvedSlideOrientation.landscape);
		installSlideNumberPreferenceMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
					background_image_id: "img-1",
					background_image_url: "https://cdn.example.com/image.png",
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const image = getByTestId("song-current-slide-image");
		expect(image.getAttribute("style")).toContain(`left: ${LANDSCAPE_IMAGE_LEFT}`);
		expect(image.getAttribute("style")).toContain(`top: ${LANDSCAPE_IMAGE_TOP}`);
		expect(image.getAttribute("style")).toContain(`width: ${LANDSCAPE_IMAGE_WIDTH}`);
		expect(image.getAttribute("style")).toContain(`height: ${LANDSCAPE_IMAGE_HEIGHT}`);
	});

	it("renders transformed lyric chords using the selected display mode", () => {
		mockUseTranslation();
		installAppStoreMock();
		installChordDisplayModeMock("solfege");
		installSlideOrientationMock();
		installSlideNumberPreferenceMock();

		render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello [C -]" },
				}}
				currentSlideIndex={0}
				displayFields={["lyrics"]}
				songKey="C"
				totalSlides={1}
			/>,
		);

		expect(screen.getByText("Hello [Do -]")).toBeTruthy();
	});
});
