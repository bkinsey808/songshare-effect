import { render } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import SongViewCurrentSlide from "./SongViewCurrentSlide";

vi.mock("react-i18next");
vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

function installI18nMock(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: (_key: string, fallback?: string) => fallback ?? "",
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

describe("song view current slide", () => {
	it("renders a background image style when slide has background_image_url", () => {
		installI18nMock();
		installSlideOrientationMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
					background_image_url: "https://cdn.example.com/image.png",
				}}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const slide = getByTestId("song-current-slide");
		expect(slide.getAttribute("style")).toContain("cdn.example.com/image.png");
	});

	it("does not render a background image style when background is missing", () => {
		installI18nMock();
		installSlideOrientationMock();

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
				}}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const slide = getByTestId("song-current-slide");
		expect(slide.getAttribute("style")).toBe("aspect-ratio: 16 / 9;");
	});

	it("uses a portrait aspect ratio when portrait orientation is active", () => {
		installI18nMock();
		installSlideOrientationMock(ResolvedSlideOrientation.portrait);

		const { getByTestId } = render(
			<SongViewCurrentSlide
				currentSlide={{
					slide_name: "Verse",
					field_data: { lyrics: "Hello" },
				}}
				displayFields={["lyrics"]}
				totalSlides={1}
			/>,
		);

		const slide = getByTestId("song-current-slide");
		expect(slide.classList.contains("aspect-[9/16]")).toBe(true);
		expect(slide.getAttribute("style")).toContain("aspect-ratio: 9 / 16");
	});
});
