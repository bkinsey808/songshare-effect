import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FocalPointCoverImage from "./FocalPointCoverImage";

const PORTRAIT_ASPECT_WIDTH = 9;
const PORTRAIT_ASPECT_HEIGHT = 16;
const PORTRAIT_ASPECT_RATIO = PORTRAIT_ASPECT_WIDTH / PORTRAIT_ASPECT_HEIGHT;
const EXACT_IMAGE_LEFT = "-3.33%";
const EXACT_IMAGE_TOP = "0%";
const EXACT_IMAGE_WIDTH = "266.67%";
const EXACT_IMAGE_HEIGHT = "100%";

describe("focal point cover image", () => {
	it("uses object-position while exact cover dimensions are unavailable", () => {
		const { getByTestId } = render(
			<FocalPointCoverImage
				alt=""
				containerAspectRatio={PORTRAIT_ASPECT_RATIO}
				data-testid="focal-image"
				focalPoint={{ focal_point_x: 20, focal_point_y: 80 }}
				slideOrientation="portrait"
				src="https://cdn.example.com/image.png"
			/>,
		);

		const image = getByTestId("focal-image");
		expect(image.className).toContain("object-cover");
		expect(image.getAttribute("style")).toContain("object-position: 20% 80%");
	});

	it("uses exact focal-point centering when source dimensions are provided", () => {
		const { getByTestId } = render(
			<FocalPointCoverImage
				alt=""
				containerAspectRatio={PORTRAIT_ASPECT_RATIO}
				data-testid="focal-image"
				focalPoint={{ focal_point_x: 20, focal_point_y: 80 }}
				imageDimensions={{ width: 1200, height: 800 }}
				slideOrientation="portrait"
				src="https://cdn.example.com/image.png"
			/>,
		);

		const image = getByTestId("focal-image");
		expect(image.className).toContain("absolute");
		expect(image.getAttribute("style")).toContain(`left: ${EXACT_IMAGE_LEFT}`);
		expect(image.getAttribute("style")).toContain(`top: ${EXACT_IMAGE_TOP}`);
		expect(image.getAttribute("style")).toContain(`width: ${EXACT_IMAGE_WIDTH}`);
		expect(image.getAttribute("style")).toContain(`height: ${EXACT_IMAGE_HEIGHT}`);
	});

	it("switches to exact focal centering after the browser reports natural image dimensions", () => {
		const { getByTestId } = render(
			<FocalPointCoverImage
				alt=""
				containerAspectRatio={PORTRAIT_ASPECT_RATIO}
				data-testid="focal-image"
				focalPoint={{ focal_point_x: 20, focal_point_y: 80 }}
				slideOrientation="portrait"
				src="https://cdn.example.com/image.png"
			/>,
		);

		const image = getByTestId("focal-image");
		Object.defineProperty(image, "naturalWidth", {
			configurable: true,
			value: 1200,
		});
		Object.defineProperty(image, "naturalHeight", {
			configurable: true,
			value: 800,
		});

		fireEvent.load(image);

		expect(image.className).toContain("absolute");
		expect(image.getAttribute("style")).toContain(`left: ${EXACT_IMAGE_LEFT}`);
		expect(image.getAttribute("style")).toContain(`top: ${EXACT_IMAGE_TOP}`);
	});
});
