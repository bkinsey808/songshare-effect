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
