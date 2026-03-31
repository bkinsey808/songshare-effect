import tw from "@/react/lib/utils/tw";

import useFocalPointCoverImage from "./useFocalPointCoverImage";

const FALLBACK_CLASS_NAME = tw`h-full w-full object-cover`;
const EXACT_LAYOUT_CLASS_NAME = tw`absolute max-w-none`;

type FocalPoint = Readonly<{
	focal_point_x: number;
	focal_point_y: number;
}>;

type ImageDimensions = Readonly<{
	width: number;
	height: number;
}>;

type FocalPointCoverImageProps = Readonly<{
	alt: string;
	containerAspectRatio: number;
	"data-testid"?: string;
	focalPoint: FocalPoint | undefined;
	imageDimensions?: ImageDimensions | undefined;
	slideOrientation: "landscape" | "portrait";
	src: string;
}>;

/**
 * Render a cover-style image that keeps a stored focal point centered when the crop allows it.
 *
 * Falls back to standard `object-position` behavior until image dimensions are known.
 *
 * @param alt - Accessible image alt text.
 * @param containerAspectRatio - Target container aspect ratio as width divided by height.
 * @param focalPoint - Stored image focal point percentages.
 * @param imageDimensions - Known source image dimensions when already available.
 * @param src - Image URL to render.
 * @returns A cover image element with focal-point-aware positioning.
 */
export default function FocalPointCoverImage({
	alt,
	containerAspectRatio,
	"data-testid": dataTestId,
	focalPoint,
	imageDimensions,
	slideOrientation,
	src,
}: FocalPointCoverImageProps): ReactElement {
	const { handleImageLoad, hasExactImageLayout, imageStyle } = useFocalPointCoverImage({
		containerAspectRatio,
		focalPoint,
		imageDimensions,
		slideOrientation,
		src,
	});

	return (
		<img
			src={src}
			alt={alt}
			data-testid={dataTestId}
			className={hasExactImageLayout ? EXACT_LAYOUT_CLASS_NAME : FALLBACK_CLASS_NAME}
			style={imageStyle}
			onLoad={handleImageLoad}
		/>
	);
}
