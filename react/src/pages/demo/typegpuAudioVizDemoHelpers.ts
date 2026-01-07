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

const MIN_PIXEL_SIZE = 1;
const MIN_DPR = 1;

export function clamp01(value: number): number {
	if (Number.isNaN(value)) {
		return ZERO;
	}
	if (value < ZERO) {
		return ZERO;
	}
	if (value > ONE) {
		return ONE;
	}
	return value;
}

export function computeRmsLevelFromTimeDomainBytes(bytes: Uint8Array): number {
	let sumSquares = ZERO;
	for (const sample of bytes) {
		const centered = sample - BYTE_MIDPOINT;
		const normalized = centered / BYTE_SCALE;
		sumSquares += normalized * normalized;
	}
	const meanSquares = sumSquares / bytes.length;
	const rms = Math.sqrt(meanSquares);
	return clamp01(rms);
}

export function smoothValue(previous: number, next: number, alpha: number): number {
	const alphaClamped = clamp01(alpha);
	return previous + (next - previous) * alphaClamped;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
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

export function drawAudioVizFallbackFrame(args: {
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

export function getMicStream(): Promise<MediaStream> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.getUserMedia !== "function") {
		throw new TypeError("This browser does not support getUserMedia() (microphone capture)");
	}
	return mediaDevices.getUserMedia({ audio: true });
}

export function getMicStreamForDevice(deviceId: string | undefined): Promise<MediaStream> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.getUserMedia !== "function") {
		throw new TypeError("This browser does not support getUserMedia() (microphone capture)");
	}
	if (deviceId === undefined || deviceId === "default") {
		return mediaDevices.getUserMedia({ audio: true });
	}
	return mediaDevices.getUserMedia({
		audio: {
			deviceId: { exact: deviceId },
		},
	});
}

export async function enumerateAudioInputDevices(): Promise<MediaDeviceInfo[]> {
	const { mediaDevices } = navigator;
	if (typeof mediaDevices?.enumerateDevices !== "function") {
		return [];
	}
	const devices = await mediaDevices.enumerateDevices();
	return devices.filter((device) => device.kind === "audioinput");
}

export function getDisplayAudioStream(): Promise<MediaStream> {
	const { mediaDevices } = navigator;
	if (mediaDevices === undefined) {
		throw new TypeError("This browser does not support mediaDevices");
	}
	if (typeof mediaDevices.getDisplayMedia !== "function") {
		throw new TypeError(
			"This browser does not support getDisplayMedia() (tab/screen audio capture)",
		);
	}
	// Many browsers require video: true for display capture; we ignore the video.
	return mediaDevices.getDisplayMedia({ audio: true, video: true });
}
