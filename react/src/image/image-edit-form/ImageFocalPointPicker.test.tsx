import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation, SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import ImageFocalPointPicker from "./ImageFocalPointPicker";

vi.mock("@/react/slide-orientation/useSlideOrientationPreference");

function makeOrientationPreference(
	effectiveSlideOrientation: "landscape" | "portrait",
): ReturnType<typeof useSlideOrientationPreference> {
	return {
		effectiveSlideOrientation,
		isSystemSlideOrientation: false,
		slideOrientationPreference:
			effectiveSlideOrientation === ResolvedSlideOrientation.portrait
				? SlideOrientationPreference.portrait
				: SlideOrientationPreference.landscape,
	};
}

describe("image focal point picker", () => {
	it("renders a portrait preview frame for portrait orientation", () => {
		vi.mocked(useSlideOrientationPreference).mockReturnValue(
			makeOrientationPreference(ResolvedSlideOrientation.portrait),
		);

		const { container } = render(
			<ImageFocalPointPicker
				altText="Alt text"
				imageName="Image name"
				imageUrl="https://cdn.example.com/image.jpg"
				focal_point_x={50}
				focal_point_y={50}
				onChange={vi.fn()}
			/>,
		);

		expect(container.querySelector(String.raw`button.aspect-\[9\/16\]`)).toBeTruthy();
	});

	it("renders a landscape preview frame for landscape orientation", () => {
		vi.mocked(useSlideOrientationPreference).mockReturnValue(
			makeOrientationPreference(ResolvedSlideOrientation.landscape),
		);

		const { container } = render(
			<ImageFocalPointPicker
				altText="Alt text"
				imageName="Image name"
				imageUrl="https://cdn.example.com/image.jpg"
				focal_point_x={50}
				focal_point_y={50}
				onChange={vi.fn()}
			/>,
		);

		expect(container.querySelector("button.aspect-video")).toBeTruthy();
	});
});
