const MIN_PIXEL_SIZE = 1;
const MIN_DPR = 1;

/**
 * Resizes a canvas' backing store to match its CSS size (accounting for device pixel ratio).
 *
 * Useful for crisp rendering in WebGPU/Canvas2D when the element is sized via layout.
 *
 * @returns void
 */
export default function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
	const rect = canvas.getBoundingClientRect();
	const rectWidth = Math.max(MIN_PIXEL_SIZE, Math.floor(rect.width));
	const rectHeight = Math.max(MIN_PIXEL_SIZE, Math.floor(rect.height));
	const dpr = Math.max(MIN_DPR, Math.floor(globalThis.devicePixelRatio ?? MIN_DPR));

	const targetWidth = rectWidth * dpr;
	const targetHeight = rectHeight * dpr;
	if (canvas.width !== targetWidth) {
		canvas.width = targetWidth;
	}
	if (canvas.height !== targetHeight) {
		canvas.height = targetHeight;
	}
}
