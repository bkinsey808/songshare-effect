import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import useFocalPointCoverImage from "./useFocalPointCoverImage";

const PORTRAIT_ASPECT_WIDTH = 9;
const PORTRAIT_ASPECT_HEIGHT = 16;
const PORTRAIT_ASPECT_RATIO = PORTRAIT_ASPECT_WIDTH / PORTRAIT_ASPECT_HEIGHT;
const LANDSCAPE_ASPECT_WIDTH = 16;
const LANDSCAPE_ASPECT_HEIGHT = 9;
const LANDSCAPE_ASPECT_RATIO = LANDSCAPE_ASPECT_WIDTH / LANDSCAPE_ASPECT_HEIGHT;
const EXACT_IMAGE_LEFT = "-3.33%";
const EXACT_IMAGE_TOP = "0%";
const EXACT_IMAGE_WIDTH = "266.67%";
const EXACT_IMAGE_HEIGHT = "100%";
const LANDSCAPE_IMAGE_LEFT = "0%";
const LANDSCAPE_IMAGE_TOP = "-9.26%";
const LANDSCAPE_IMAGE_WIDTH = "100%";
const LANDSCAPE_IMAGE_HEIGHT = "118.52%";
const PORTRAIT_IN_WIDE_VIEWPORT_TOP = "-14.81%";
const LANDSCAPE_FOCAL_POINT_X = 20;
const LANDSCAPE_FOCAL_POINT_Y = 50;
const NATURAL_IMAGE_WIDTH = 1200;
const NATURAL_IMAGE_HEIGHT = 800;
const PORTRAIT_FOCAL_POINT_X = 20;
const PORTRAIT_FOCAL_POINT_Y = 80;

describe("useFocalPointCoverImage", () => {
	it("falls back to object-position while exact cover dimensions are unavailable", () => {
		const { result } = renderHook(() =>
			useFocalPointCoverImage({
				containerAspectRatio: PORTRAIT_ASPECT_RATIO,
				focalPoint: { focal_point_x: 20, focal_point_y: 80 },
				slideOrientation: "portrait",
				src: "https://cdn.example.com/image.png",
			}),
		);

		expect(result.current.hasExactImageLayout).toBe(false);
		expect(result.current.imageStyle).toStrictEqual({
			objectPosition: "20% 80%",
		});
	});

	it("uses exact focal-point centering when source dimensions are provided", () => {
		const { result } = renderHook(() =>
			useFocalPointCoverImage({
				containerAspectRatio: PORTRAIT_ASPECT_RATIO,
				focalPoint: { focal_point_x: 20, focal_point_y: 80 },
				imageDimensions: { width: NATURAL_IMAGE_WIDTH, height: NATURAL_IMAGE_HEIGHT },
				slideOrientation: "portrait",
				src: "https://cdn.example.com/image.png",
			}),
		);

		expect(result.current.hasExactImageLayout).toBe(true);
		expect(result.current.imageStyle).toMatchObject({
			height: EXACT_IMAGE_HEIGHT,
			left: EXACT_IMAGE_LEFT,
			top: EXACT_IMAGE_TOP,
			width: EXACT_IMAGE_WIDTH,
		});
	});

	it("switches to exact focal centering after the browser reports natural image dimensions", () => {
		const { result } = renderHook(() =>
			useFocalPointCoverImage({
				containerAspectRatio: PORTRAIT_ASPECT_RATIO,
				focalPoint: { focal_point_x: 20, focal_point_y: 80 },
				slideOrientation: "portrait",
				src: "https://cdn.example.com/image.png",
			}),
		);

		act(() => {
			result.current.handleImageLoad(
				forceCast<React.SyntheticEvent<HTMLImageElement>>({
					currentTarget: {
						naturalHeight: NATURAL_IMAGE_HEIGHT,
						naturalWidth: NATURAL_IMAGE_WIDTH,
					},
				}),
			);
		});

		expect(result.current.hasExactImageLayout).toBe(true);
		expect(result.current.imageStyle).toMatchObject({
			left: EXACT_IMAGE_LEFT,
			top: EXACT_IMAGE_TOP,
		});
	});

	it("centers the focal point vertically in landscape when the crop allows it", () => {
		const { result } = renderHook(() =>
			useFocalPointCoverImage({
				containerAspectRatio: LANDSCAPE_ASPECT_RATIO,
				focalPoint: {
					focal_point_x: LANDSCAPE_FOCAL_POINT_X,
					focal_point_y: LANDSCAPE_FOCAL_POINT_Y,
				},
				imageDimensions: { width: NATURAL_IMAGE_WIDTH, height: NATURAL_IMAGE_HEIGHT },
				slideOrientation: "landscape",
				src: "https://cdn.example.com/image.png",
			}),
		);

		expect(result.current.hasExactImageLayout).toBe(true);
		expect(result.current.imageStyle).toMatchObject({
			height: LANDSCAPE_IMAGE_HEIGHT,
			left: LANDSCAPE_IMAGE_LEFT,
			top: LANDSCAPE_IMAGE_TOP,
			width: LANDSCAPE_IMAGE_WIDTH,
		});
	});

	it("keeps portrait centering behavior in a wide viewport when the slide orientation is portrait", () => {
		const { result } = renderHook(() =>
			useFocalPointCoverImage({
				containerAspectRatio: LANDSCAPE_ASPECT_RATIO,
				focalPoint: {
					focal_point_x: PORTRAIT_FOCAL_POINT_X,
					focal_point_y: PORTRAIT_FOCAL_POINT_Y,
				},
				imageDimensions: { width: NATURAL_IMAGE_WIDTH, height: NATURAL_IMAGE_HEIGHT },
				slideOrientation: "portrait",
				src: "https://cdn.example.com/image.png",
			}),
		);

		expect(result.current.hasExactImageLayout).toBe(true);
		expect(result.current.imageStyle).toMatchObject({
			height: LANDSCAPE_IMAGE_HEIGHT,
			left: LANDSCAPE_IMAGE_LEFT,
			top: PORTRAIT_IN_WIDE_VIEWPORT_TOP,
			width: LANDSCAPE_IMAGE_WIDTH,
		});
	});
});
