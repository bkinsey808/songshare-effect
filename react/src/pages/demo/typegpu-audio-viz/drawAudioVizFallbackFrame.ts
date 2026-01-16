const ZERO = 0;
const ONE = 1;

const BYTE_MIDPOINT = 128;
const BYTE_SCALE = 128;

const TWO = 2;

const WAVEFORM_Y_SCALE = 0.35;

const CLEAR_X = 0;
const CLEAR_Y = 0;

const WAVEFORM_LINE_WIDTH = 2;
const WAVEFORM_STROKE_STYLE = "rgba(255,255,255,0.9)";
const BACKGROUND_FILL_STYLE = "rgb(10,10,10)";
const METER_FILL_STYLE = "rgba(79,70,229,0.9)";
const TEXT_FILL_STYLE = "rgba(255,255,255,0.9)";

const TEXT_X = 12;
const TEXT_Y = 24;
const METER_X = 12;
const METER_Y = 42;
const METER_WIDTH = 300;
const METER_HEIGHT = 14;

const WAVEFORM_INDEX_STEP = 1;

/**
 * Draw a simple fallback audio visualization to a 2D canvas.
 *
 * This renders a level meter, a time-domain waveform (from PCM bytes), and
 * a small text overlay showing the reported microphone level.
 *
 * Note: This is intentionally lightweight and runs on the main thread as a
 * fallback visualization when more advanced GPU-based rendering isn't
 * available.
 *
 * @param args - Options for rendering
 * @param args.ctx - Canvas 2D rendering context to draw into
 * @param args.canvas - The canvas element (used for size)
 * @param args.bytes - Time-domain PCM bytes (Uint8Array, 0-255) used for waveform
 * @param args.level - Normalized level (0..1) used to fill the level meter
 * @param args.levelDecimals - Number of decimals to show for the level text
 */
export default function drawAudioVizFallbackFrame(args: {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	bytes: Uint8Array;
	level: number;
	levelDecimals: number;
}): void {
	const { ctx, canvas, bytes, level, levelDecimals } = args;

	ctx.clearRect(CLEAR_X, CLEAR_Y, canvas.width, canvas.height);
	ctx.fillStyle = BACKGROUND_FILL_STYLE;
	ctx.fillRect(CLEAR_X, CLEAR_Y, canvas.width, canvas.height);

	// Level meter
	ctx.fillStyle = METER_FILL_STYLE;
	ctx.fillRect(METER_X, METER_Y, METER_WIDTH * level, METER_HEIGHT);
	ctx.strokeStyle = "rgba(255,255,255,0.25)";
	ctx.strokeRect(METER_X, METER_Y, METER_WIDTH, METER_HEIGHT);

	// Waveform
	ctx.lineWidth = WAVEFORM_LINE_WIDTH;
	ctx.strokeStyle = WAVEFORM_STROKE_STYLE;
	ctx.beginPath();
	for (let index = ZERO; index < bytes.length; index += WAVEFORM_INDEX_STEP) {
		const waveformX = (index / (bytes.length - ONE)) * canvas.width;
		const sample = bytes[index] ?? BYTE_MIDPOINT;
		const centered = sample - BYTE_MIDPOINT;
		const normalized = centered / BYTE_SCALE;
		const waveformY = canvas.height / TWO + normalized * (canvas.height * WAVEFORM_Y_SCALE);
		if (index === ZERO) {
			ctx.moveTo(waveformX, waveformY);
		} else {
			ctx.lineTo(waveformX, waveformY);
		}
	}
	ctx.stroke();

	// Text overlay
	ctx.fillStyle = TEXT_FILL_STYLE;
	ctx.font = "16px monospace";
	ctx.fillText(`mic level: ${level.toFixed(levelDecimals)}`, TEXT_X, TEXT_Y);
}
