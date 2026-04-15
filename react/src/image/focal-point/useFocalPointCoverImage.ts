import { useEffect, useState } from "react";

import getCoverImageLayout from "./getCoverImageLayout";
import getImageObjectPosition from "./getImageObjectPosition";

const MIN_OFFSET = 0;

type FocalPoint = Readonly<{
	focal_point_x: number;
	focal_point_y: number;
}>;

type ImageDimensions = Readonly<{
	width: number;
	height: number;
}>;

type UseFocalPointCoverImageArgs = Readonly<{
	containerAspectRatio: number;
	focalPoint: FocalPoint | undefined;
	imageDimensions?: ImageDimensions | undefined;
	slideOrientation: "landscape" | "portrait";
	src: string;
}>;

type UseFocalPointCoverImageResult = Readonly<{
	hasExactImageLayout: boolean;
	imageStyle: React.CSSProperties;
	handleImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}>;

/**
 * Resolve cover-image layout styles that keep a stored focal point centered when the crop allows it.
 *
 * Falls back to standard `object-position` behavior until image dimensions are known.
 *
 * @param containerAspectRatio - Target container aspect ratio as width divided by height.
 * @param focalPoint - Stored image focal point percentages.
 * @param imageDimensions - Known source image dimensions when already available.
 * @param slideOrientation - Slide orientation that decides which axis should stay centered (`landscape` or `portrait`).
 * @param src - Image URL being rendered.
 * @returns Exact-layout state, computed style, and an image-load handler for browser-measured dimensions.
 */
export default function useFocalPointCoverImage({
	containerAspectRatio,
	focalPoint,
	imageDimensions,
	slideOrientation,
	src,
}: UseFocalPointCoverImageArgs): UseFocalPointCoverImageResult {
	const [loadedImageDimensions, setLoadedImageDimensions] = useState<ImageDimensions | undefined>(
		undefined,
	);

	// Reset browser-measured dimensions when the rendered image source changes.
	useEffect(() => {
		setLoadedImageDimensions(undefined);
	}, [src]);

	const resolvedImageDimensions = imageDimensions ?? loadedImageDimensions;
	const hasExactImageLayout = resolvedImageDimensions !== undefined && focalPoint !== undefined;
	const imageStyle = hasExactImageLayout
		? getCoverImageLayout({
				containerAspectRatio,
				focalPoint,
				imageDimensions: resolvedImageDimensions,
				slideOrientation,
			})
		: {
				objectPosition: focalPoint === undefined ? "center" : getImageObjectPosition(focalPoint),
			};

	/**
	 * Browser image `onLoad` handler that captures intrinsic image dimensions.
	 *
	 * When dimensions are valid, they are stored in state so exact layout
	 * calculations can be performed.
	 *
	 * @param event - Image load synthetic event from React.
	 * @returns void
	 */
	function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>): void {
		const nextWidth = event.currentTarget.naturalWidth;
		const nextHeight = event.currentTarget.naturalHeight;
		if (nextWidth > MIN_OFFSET && nextHeight > MIN_OFFSET) {
			setLoadedImageDimensions({
				width: nextWidth,
				height: nextHeight,
			});
		}
	}

	return {
		handleImageLoad,
		hasExactImageLayout,
		imageStyle,
	};
}
