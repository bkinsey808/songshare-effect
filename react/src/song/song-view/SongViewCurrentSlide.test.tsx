import { render } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import SongViewCurrentSlide from "./SongViewCurrentSlide";

vi.mock("react-i18next");

function installI18nMock(): void {
	vi.mocked(useTranslation).mockReturnValue(
		forceCast<ReturnType<typeof useTranslation>>({
			t: (_key: string, fallback?: string) => fallback ?? "",
			i18n: { changeLanguage: vi.fn(), language: "en" },
		}),
	);
}

describe("song view current slide", () => {
	it("renders a background image style when slide has background_image_url", () => {
		installI18nMock();

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
		expect(slide.getAttribute("style")).toBeNull();
	});
});
