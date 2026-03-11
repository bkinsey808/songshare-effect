import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import drawAudioVizFallbackFrame from "./drawAudioVizFallbackFrame";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;
const BYTE_ARRAY_LENGTH = 64;
const BYTE_ARRAY_HALF = 32;
const BYTE_MIDPOINT = 128;
const CLEAR_X = 0;
const CLEAR_Y = 0;
const TEXT_X = 12;
const TEXT_Y = 24;
const METER_X = 12;
const METER_Y = 42;
const METER_WIDTH = 300;
const METER_HEIGHT = 14;
describe("drawAudioVizFallbackFrame", () => {
	it("calls clearRect with canvas dimensions", () => {
		const ctx = {
			clearRect: vi.fn(),
			fillStyle: "",
			fillRect: vi.fn(),
			strokeStyle: "",
			strokeRect: vi.fn(),
			lineWidth: 0,
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			stroke: vi.fn(),
			font: "",
			fillText: vi.fn(),
		};
		const canvas = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
		const bytes = new Uint8Array(BYTE_ARRAY_LENGTH).fill(BYTE_MIDPOINT);
		const level = 0.5;
		const levelDecimals = 2;

		drawAudioVizFallbackFrame({
			ctx: forceCast<CanvasRenderingContext2D>(ctx),
			canvas: forceCast<HTMLCanvasElement>(canvas),
			bytes,
			level,
			levelDecimals,
		});

		expect(ctx.clearRect).toHaveBeenCalledWith(CLEAR_X, CLEAR_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
	});

	it("fills level meter proportional to level", () => {
		const ctx = {
			clearRect: vi.fn(),
			fillStyle: "",
			fillRect: vi.fn(),
			strokeStyle: "",
			strokeRect: vi.fn(),
			lineWidth: 0,
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			stroke: vi.fn(),
			font: "",
			fillText: vi.fn(),
		};
		const canvas = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
		const level = 0.5;

		drawAudioVizFallbackFrame({
			ctx: forceCast<CanvasRenderingContext2D>(ctx),
			canvas: forceCast<HTMLCanvasElement>(canvas),
			bytes: new Uint8Array(BYTE_ARRAY_HALF).fill(BYTE_MIDPOINT),
			level,
			levelDecimals: 1,
		});

		const meterFillWidth = METER_WIDTH * level;
		expect(ctx.fillRect).toHaveBeenCalledWith(METER_X, METER_Y, meterFillWidth, METER_HEIGHT);
	});

	it("renders level text with given decimals", () => {
		const ctx = {
			clearRect: vi.fn(),
			fillStyle: "",
			fillRect: vi.fn(),
			strokeStyle: "",
			strokeRect: vi.fn(),
			lineWidth: 0,
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			stroke: vi.fn(),
			font: "",
			fillText: vi.fn(),
		};
		const level = 0.75;
		const levelDecimals = 3;

		drawAudioVizFallbackFrame({
			ctx: forceCast<CanvasRenderingContext2D>(ctx),
			canvas: forceCast<HTMLCanvasElement>({
				width: CANVAS_WIDTH,
				height: CANVAS_HEIGHT,
			}),
			bytes: new Uint8Array(BYTE_ARRAY_HALF).fill(BYTE_MIDPOINT),
			level,
			levelDecimals,
		});

		expect(ctx.fillText).toHaveBeenCalledWith(
			`mic level: ${level.toFixed(levelDecimals)}`,
			TEXT_X,
			TEXT_Y,
		);
	});
});
