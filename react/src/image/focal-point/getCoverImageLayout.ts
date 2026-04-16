const FULL_PERCENT = 100;
const DECIMAL_PLACES = 2;
const HALF = 2;
const MIN_OFFSET = 0;
const SQUARE_ASPECT_RATIO = 1;
const DEFAULT_OFFSET = 0;
const PORTRAIT_SLIDE_ORIENTATION = "portrait";

type FocalPoint = Readonly<{
	focal_point_x: number;
	focal_point_y: number;
}>;

type ImageDimensions = Readonly<{
	width: number;
	height: number;
}>;

/**
 * Format a decimal value as a percentage string with limited decimal places.
 *
 * @param value - Numeric value to format.
 * @returns A percentage string suitable for CSS values (e.g. "50.00%").
 */
function formatPercent(value: number): string {
	return `${Number(value.toFixed(DECIMAL_PLACES))}%`;
}

/**
 * Clamp a number to the inclusive [minimum, maximum] range.
 *
 * @param value - Value to clamp.
 * @param minimum - Minimum allowed value.
 * @param maximum - Maximum allowed value.
 * @returns The clamped number.
 */
function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Compute the virtual container dimensions used to scale the source image.
 *
 * The container is normalized so one axis has size 1 and the other is the
 * container aspect ratio relative to that axis.
 *
 * @param containerAspectRatio - Target container aspect ratio as width divided by height.
 * @returns Width/height representation for layout math.
 */
function getContainerDimensions(containerAspectRatio: number): ImageDimensions {
	if (containerAspectRatio >= SQUARE_ASPECT_RATIO) {
		return {
			width: containerAspectRatio,
			height: SQUARE_ASPECT_RATIO,
		};
	}

	return {
		width: SQUARE_ASPECT_RATIO,
		height: SQUARE_ASPECT_RATIO / containerAspectRatio,
	};
}

/**
 * Compute the virtual container dimensions used to scale the source image.
 *
 * The container is normalized so one axis has size 1 and the other is the
 * container aspect ratio relative to that axis.
 *
 * @param containerAspectRatio - Target container aspect ratio as width divided by height.
 * @returns Width/height representation for layout math.
 */

/**
 * Calculate an offset that centers the focal point along an axis.
 *
 * @param containerSize - Size of the container along the axis.
 * @param focalPointValue - Normalized focal point (0..1) along the same axis.
 * @param renderedSize - Rendered size of the image along the axis after scaling.
 * @returns Raw pixel offset before clamping.
 */
function getCenteredOffset(
	containerSize: number,
	focalPointValue: number,
	renderedSize: number,
): number {
	return containerSize / HALF - focalPointValue * renderedSize;
}

/**
 * Calculate a proportional offset that keeps the image edge aligned based on focal point.
 *
 * This is used when centering is not possible; it shifts the image proportionally so
 * the focal point remains at an appropriate distance from the container edge.
 *
 * @param containerSize - Size of the container along the axis.
 * @param focalPointValue - Normalized focal point (0..1) along the same axis.
 * @param renderedSize - Rendered size of the image along the axis after scaling.
 * @returns Raw pixel offset before clamping.
 */
function getProportionalOffset(
	containerSize: number,
	focalPointValue: number,
	renderedSize: number,
): number {
	return DEFAULT_OFFSET - focalPointValue * (renderedSize - containerSize);
}

/**
 * Calculate CSS sizing and offsets for a cover image that prioritizes focal-point centering.
 *
 * Portrait containers center the focal point horizontally when possible. Landscape containers center it vertically when possible.
 *
 * @param containerAspectRatio - Target container aspect ratio as width divided by height.
 * @param focalPoint - Stored focal point percentages for the source image.
 * @param imageDimensions - Source image dimensions.
 * @param slideOrientation - Slide orientation that decides which axis should stay centered.
 * @returns CSS width, height, left, and top values for an absolutely positioned `<img>`.
 */
export default function getCoverImageLayout({
	containerAspectRatio,
	focalPoint,
	imageDimensions,
	slideOrientation,
}: Readonly<{
	containerAspectRatio: number;
	focalPoint: FocalPoint;
	imageDimensions: ImageDimensions;
	slideOrientation: "landscape" | "portrait";
}>): React.CSSProperties {
	const containerDimensions = getContainerDimensions(containerAspectRatio);
	const scale = Math.max(
		containerDimensions.width / imageDimensions.width,
		containerDimensions.height / imageDimensions.height,
	);
	const renderedWidth = imageDimensions.width * scale;
	const renderedHeight = imageDimensions.height * scale;
	const focalX = focalPoint.focal_point_x / FULL_PERCENT;
	const focalY = focalPoint.focal_point_y / FULL_PERCENT;
	const centerHorizontalAxis = slideOrientation === PORTRAIT_SLIDE_ORIENTATION;
	const rawLeft = centerHorizontalAxis
		? getCenteredOffset(containerDimensions.width, focalX, renderedWidth)
		: getProportionalOffset(containerDimensions.width, focalX, renderedWidth);
	const rawTop = centerHorizontalAxis
		? getProportionalOffset(containerDimensions.height, focalY, renderedHeight)
		: getCenteredOffset(containerDimensions.height, focalY, renderedHeight);
	const left = clamp(rawLeft, containerDimensions.width - renderedWidth, MIN_OFFSET);
	const top = clamp(rawTop, containerDimensions.height - renderedHeight, MIN_OFFSET);

	return {
		width: formatPercent((renderedWidth / containerDimensions.width) * FULL_PERCENT),
		height: formatPercent((renderedHeight / containerDimensions.height) * FULL_PERCENT),
		left: formatPercent((left / containerDimensions.width) * FULL_PERCENT),
		top: formatPercent((top / containerDimensions.height) * FULL_PERCENT),
	};
}
