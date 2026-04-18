type FrameSpec = {
	fillStyle: string;
	area: { left: number; top: number; width: number; height: number };
	text: string;
	font: string;
	textPos: { left: number; top: number };
};

const DEFAULT_FRAME_INCREMENT = 1;
const DEFAULT_HUE_MAX = 360;
const DEFAULT_CLEAR_X = 0;
const DEFAULT_CLEAR_Y = 0;

/**
 * Construct a deterministic frame spec describing background and text to render.
 *
 * @param frame - Frame number.
 * @param frameIncrement - Optional frame increment used to advance hue.
 * @param hueMax - Optional maximum hue value for the color wheel.
 * @param clearX - Optional clear X coordinate for the background area.
 * @param clearY - Optional clear Y coordinate for the background area.
 * @param width - Width of the rendered frame.
 * @param height - Height of the rendered frame.
 * @param textX - X coordinate for the text position.
 * @param textY - Y coordinate for the text position.
 * @param hasModule - Whether the frame contains the typegpu module indicator.
 * @param font - Optional font string used for rendering text.
 * @returns FrameSpec describing colors, text and layout for the frame.
 */
export default function renderFrameSpec(
	frame: number,
	options: {
		frameIncrement?: number;
		hueMax?: number;
		clearX?: number;
		clearY?: number;
		width: number;
		height: number;
		textX: number;
		textY: number;
		hasModule: boolean;
		font?: string;
	},
): FrameSpec {
	const FRAME_INCREMENT = options.frameIncrement ?? DEFAULT_FRAME_INCREMENT;
	const HUE_MAX = options.hueMax ?? DEFAULT_HUE_MAX;
	const CLEAR_X = options.clearX ?? DEFAULT_CLEAR_X;
	const CLEAR_Y = options.clearY ?? DEFAULT_CLEAR_Y;

	const hue = (frame * FRAME_INCREMENT) % HUE_MAX;
	const fillStyle = `hsl(${hue}, 60%, 50%)`;
	const area = { left: CLEAR_X, top: CLEAR_Y, width: options.width, height: options.height };
	const text = `typegpu module found: ${options.hasModule}`;
	const font = options.font ?? "20px monospace";
	const textPos = { left: options.textX, top: options.textY };

	return { fillStyle, area, text, font, textPos };
}
