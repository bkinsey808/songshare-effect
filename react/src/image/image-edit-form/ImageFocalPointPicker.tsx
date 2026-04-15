import getImageObjectPosition from "@/react/image/focal-point/getImageObjectPosition";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import { ResolvedSlideOrientation } from "@/shared/user/slideOrientationPreference";

import type { ImageFocalPoint } from "../image-types";

type ImageFocalPointPickerProps = {
	altText: string;
	imageName: string;
	imageUrl: string | undefined;
	onChange: (focalPoint: ImageFocalPoint) => void;
	focal_point_x: number;
	focal_point_y: number;
};

const MIN_FOCAL_POINT = 0;
const MAX_FOCAL_POINT = 100;
const FOCAL_POINT_STEP = 0.1;
const FOCAL_POINT_ROUNDING_FACTOR = 10;
const FOCAL_POINT_DECIMAL_PLACES = 1;

/**
 * Clamp a focal point value to the allowed range [0,100].
 *
 * @param value - candidate focal point value
 * @returns clamped focal point value
 */
function clampFocalPointValue(value: number): number {
	return Math.min(MAX_FOCAL_POINT, Math.max(MIN_FOCAL_POINT, value));
}

/**
 * Round a focal point value to the configured precision for UI display.
 *
 * @param value - raw focal point value
 * @returns rounded focal point value
 */
function roundFocalPointValue(value: number): number {
	return (
		Math.round(clampFocalPointValue(value) * FOCAL_POINT_ROUNDING_FACTOR) /
		FOCAL_POINT_ROUNDING_FACTOR
	);
}

/**
 * Format a focal point number for display with fixed decimals.
 *
 * @param value - focal point value
 * @returns formatted string with decimal places
 */
function formatFocalPointValue(value: number): string {
	return roundFocalPointValue(value).toFixed(FOCAL_POINT_DECIMAL_PLACES);
}

/**
 * Interactive focal-point editor for cropped image renders.
 *
 * Users can click the preview to place the focal point and fine-tune it with
 * range inputs for keyboard-friendly editing.
 *
 * @param altText - Accessible alt text for the image preview.
 * @param imageName - Fallback image name used when alt text is empty.
 * @param imageUrl - Optional image URL displayed in the preview.
 * @param onChange - Callback invoked with updated focal point coordinates.
 * @param focal_point_x - Current horizontal focal point percentage (0-100).
 * @param focal_point_y - Current vertical focal point percentage (0-100).
 * @returns React element for focal point editing.
 */
export default function ImageFocalPointPicker({
	altText,
	imageName,
	imageUrl,
	onChange,
	focal_point_x,
	focal_point_y,
}: ImageFocalPointPickerProps): ReactElement {
	const { effectiveSlideOrientation } = useSlideOrientationPreference();
	const previewAspectClassName =
		effectiveSlideOrientation === ResolvedSlideOrientation.portrait
			? "aspect-[9/16]"
			: "aspect-video";

	/**
	 * Update the focal point and normalize values to the UI precision.
	 *
	 * @param nextFocalPoint - new focal point coordinates
	 * @returns void
	 */
	function updateFocalPoint(nextFocalPoint: ImageFocalPoint): void {
		onChange({
			focal_point_x: roundFocalPointValue(nextFocalPoint.focal_point_x),
			focal_point_y: roundFocalPointValue(nextFocalPoint.focal_point_y),
		});
	}

	/**
	 * Place the focal point based on a click inside the preview element.
	 *
	 * @param event - click event from the preview button
	 * @returns void
	 */
	function handlePreviewClick(event: React.MouseEvent<HTMLButtonElement>): void {
		const rect = event.currentTarget.getBoundingClientRect();
		const relativeX = ((event.clientX - rect.left) / rect.width) * MAX_FOCAL_POINT;
		const relativeY = ((event.clientY - rect.top) / rect.height) * MAX_FOCAL_POINT;

		updateFocalPoint({
			focal_point_x: relativeX,
			focal_point_y: relativeY,
		});
	}

	/**
	 * Handle horizontal range input changes.
	 *
	 * @param event - change event from the horizontal range input
	 * @returns void
	 */
	function handleHorizontalChange(event: React.ChangeEvent<HTMLInputElement>): void {
		updateFocalPoint({
			focal_point_x: Number(event.target.value),
			focal_point_y,
		});
	}

	/**
	 * Handle vertical range input changes.
	 *
	 * @param event - change event from the vertical range input
	 * @returns void
	 */
	function handleVerticalChange(event: React.ChangeEvent<HTMLInputElement>): void {
		updateFocalPoint({
			focal_point_x,
			focal_point_y: Number(event.target.value),
		});
	}

	return (
		<div className="space-y-4">
			<div>
				<label htmlFor="focal-point-preview" className="mb-2 block text-sm font-medium text-gray-300">
					Focal Point
				</label>
				<p className="mb-3 text-xs text-gray-400">
					Click the preview to choose the part of the image that should stay centered in
					cropped layouts.
				</p>
				{imageUrl === undefined ? (
					<div
						className={`flex items-center justify-center rounded-lg border border-dashed border-gray-600 bg-gray-800/40 text-sm text-gray-500 ${previewAspectClassName}`}
					>
						Image preview unavailable
					</div>
				) : (
					<button
						id="focal-point-preview"
						type="button"
						onClick={handlePreviewClick}
						className={`group relative block w-full overflow-hidden rounded-xl border border-gray-600 bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${previewAspectClassName}`}
					>
						<img
							src={imageUrl}
							alt={altText === "" ? imageName : altText}
							className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
							style={{
								objectPosition: getImageObjectPosition({
									focal_point_x,
									focal_point_y,
								}),
							}}
						/>
						<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
						<div
							className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500/30 shadow-[0_0_0_9999px_rgba(15,23,42,0.12)]"
							style={{
								left: `${focal_point_x}%`,
								top: `${focal_point_y}%`,
							}}
						>
							<div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
						</div>
					</button>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label htmlFor="focal-point-x" className="mb-2 block text-xs font-medium text-gray-400">
						Horizontal: {formatFocalPointValue(focal_point_x)}%
					</label>
					<input
						id="focal-point-x"
						type="range"
						min={MIN_FOCAL_POINT}
						max={MAX_FOCAL_POINT}
						step={FOCAL_POINT_STEP}
						value={focal_point_x}
						onChange={handleHorizontalChange}
						className="w-full accent-blue-500"
					/>
				</div>
				<div>
					<label htmlFor="focal-point-y" className="mb-2 block text-xs font-medium text-gray-400">
						Vertical: {formatFocalPointValue(focal_point_y)}%
					</label>
					<input
						id="focal-point-y"
						type="range"
						min={MIN_FOCAL_POINT}
						max={MAX_FOCAL_POINT}
						step={FOCAL_POINT_STEP}
						value={focal_point_y}
						onChange={handleVerticalChange}
						className="w-full accent-blue-500"
					/>
				</div>
			</div>
		</div>
	);
}
