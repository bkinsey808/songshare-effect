import type { ImageFocalPoint } from "../image-types";

const MIN_FOCAL_POINT = 0;
const MAX_FOCAL_POINT = 100;
const DEFAULT_FOCAL_POINT = 50;

/**
 * Clamp and sanitize a stored focal point value to a valid percentage.
 *
 * Non-finite values fall back to the default focal point. Values are clamped
 * to the inclusive range [0, 100].
 *
 * @param value - Raw focal point value to sanitize.
 * @returns A safe focal point percentage between 0 and 100.
 */
function clampFocalPointValue(value: number): number {
	if (!Number.isFinite(value)) {
		return DEFAULT_FOCAL_POINT;
	}
	return Math.min(MAX_FOCAL_POINT, Math.max(MIN_FOCAL_POINT, value));
}

/**
 * Build a CSS `object-position` string from stored focal point percentages.
 *
 * @param focalPoint - Stored focal point percentages for the image.
 * @returns CSS object-position string suitable for object-cover renders.
 */
export default function getImageObjectPosition(focalPoint: ImageFocalPoint): string {
	return `${clampFocalPointValue(focalPoint.focal_point_x)}% ${clampFocalPointValue(focalPoint.focal_point_y)}%`;
}
