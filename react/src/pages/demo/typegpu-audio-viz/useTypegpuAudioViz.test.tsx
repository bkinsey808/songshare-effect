import type { RefObject } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MinimalMediaStream } from "@/react/audio/types";

import useAudioVizInput from "@/react/audio/useAudioVizInput";
import resizeCanvasToDisplaySize from "@/react/canvas/resizeCanvasToDisplaySize";
import { useCanvasAnimation, type DrawFn } from "@/react/canvas/useCanvasAnimation";
import drawAudioVizFallbackFrame from "@/react/pages/demo/typegpu-audio-viz/drawAudioVizFallbackFrame";
import runTypeGpuAudioVizDemo from "@/react/typegpu/runTypeGpuAudioVizDemo";

import useTypegpuAudioViz from "./useTypegpuAudioViz";

/**
 * Mocks for downstream dependencies — tests assert interactions rather than
 * exercising heavy WebGPU/canvas logic.
 *
 * NOTE: this test file intentionally uses several runtime-shaped mocks and
 * partial objects to exercise fallback and integration paths. To keep
 * the assertions readable and focused on behavior we permit a few
 * narrow, test-only lint/type exceptions below.
 */
vi.mock("@/react/audio/useAudioVizInput");
vi.mock("@/react/canvas/useCanvasAnimation");
vi.mock("@/react/canvas/resizeCanvasToDisplaySize");
vi.mock("@/react/pages/demo/typegpu-audio-viz/drawAudioVizFallbackFrame");
vi.mock("@/react/typegpu/runTypeGpuAudioVizDemo");

const mockUseAudioVizInput = vi.mocked(useAudioVizInput);
const mockUseCanvasAnimation = vi.mocked(useCanvasAnimation);
const mockResize = vi.mocked(resizeCanvasToDisplaySize);
const mockDrawFallback = vi.mocked(drawAudioVizFallbackFrame);
const mockRunTypegpu = vi.mocked(runTypeGpuAudioVizDemo);

function makeMinimalStream(): MinimalMediaStream {
	return {
		getTracks(): { stop: () => void }[] {
			return [
				{
					stop() {
						/* noop */
					},
				},
			];
		},
		getAudioTracks(): { stop: () => void }[] {
			return [
				{
					stop() {
						/* noop */
					},
				},
			];
		},
	};
}

// Test helpers: narrow runtime values without using non-null assertions or
// inline eslint disables. These follow the project's existing test patterns
// (see `useCanvasAnimation.test.tsx`).
function assertIs2DContext(value: unknown): asserts value is CanvasRenderingContext2D {
	expect(value).toBeDefined();
}

function assertIsDrawFn(value: unknown): asserts value is DrawFn {
	expect(typeof value).toBe("function");
}
describe("useTypegpuAudioViz (behavior)", () => {
	const DEFAULT_LEVEL = 0;
	const FFT_SIZE = 16;
	const ONE_CALL = 1;
	const SAMPLE_BYTE_1 = 1;
	const SAMPLE_BYTE_2 = 2;
	const SAMPLE_BYTE_3 = 3;
	const SAMPLE_BYTES = [SAMPLE_BYTE_1, SAMPLE_BYTE_2, SAMPLE_BYTE_3] as const;

	function setup(overrides: Partial<Partial<ReturnType<typeof useAudioVizInput>>> = {}): {
		canvas: HTMLCanvasElement;
		startCanvasSpy: ReturnType<typeof vi.fn>;
		stopCanvasSpy: ReturnType<typeof vi.fn>;
		getCapturedDraw: () => DrawFn | undefined;
	} {
		vi.clearAllMocks();
		const canvas = document.createElement("canvas");
		let capturedDraw: DrawFn | undefined = undefined;
		const startCanvasSpy = vi.fn(
			(
				_canvas: HTMLCanvasElement,
				draw: DrawFn,
				_options?: { loop: boolean; duration: number; onFinish?: () => void },
			) => {
				capturedDraw = draw;
			},
		);
		const stopCanvasSpy = vi.fn<() => void>();
		mockUseCanvasAnimation.mockReturnValue({
			start: startCanvasSpy,
			stop: stopCanvasSpy,
			isRunning: () => false,
		} as ReturnType<typeof useCanvasAnimation>);
		mockResize.mockImplementation(() => undefined);
		mockDrawFallback.mockImplementation(() => undefined);

		const defaults: ReturnType<typeof useAudioVizInput> = {
			startLevelUiTimer: vi.fn(),
			stopLevelUiTimer: vi.fn(),
			readSmoothedLevelNow: () => DEFAULT_LEVEL,
			readBytesAndSmoothedLevelNow: () => ({
				bytes: new Uint8Array(FFT_SIZE),
				level: DEFAULT_LEVEL,
			}),
			resetLevel: vi.fn(),
			levelUiValue: 0,
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return undefined;
			},
			startDeviceAudio: async () => {
				await Promise.resolve();
				return undefined;
			},
			stop: async () => {
				await Promise.resolve();
				return undefined;
			},
			selectedAudioInputDeviceId: "default",
			setSelectedAudioInputDeviceId: vi.fn(),
			audioInputDevicesRefreshKey: 0,
			status: "idle",
			errorMessage: undefined,
			currentStreamLabel: "microphone",
		};

		mockUseAudioVizInput.mockReturnValue({
			...defaults,
			...(overrides as Partial<ReturnType<typeof useAudioVizInput>>),
		});
		return { canvas, startCanvasSpy, stopCanvasSpy, getCapturedDraw: () => capturedDraw };
	}

	it("exports a function", () => {
		expect(typeof useTypegpuAudioViz).toBe("function");
	});

	it("mirrors audio status and error message from useAudioVizInput", () => {
		setup({
			status: "requesting-mic",
			errorMessage: "boom",
			currentStreamLabel: undefined,
		});

		const nullCanvasRef = {
			current: document.querySelector<HTMLCanvasElement>("#no-canvas"),
		} as RefObject<HTMLCanvasElement | null>;
		const { result } = renderHook(() => useTypegpuAudioViz(nullCanvasRef));
		expect(result.current.status).toBe("requesting-mic");
		expect(result.current.errorMessage).toBe("boom");
	});

	it("startMic -> TypeGPU path calls runTypegpu and updates status/renderInfo", async () => {
		const mockStartLevel = vi.fn();
		const mockReadNow = vi.fn(() => DEFAULT_LEVEL);
		const { canvas } = setup({
			startLevelUiTimer: mockStartLevel,
			readSmoothedLevelNow: mockReadNow,
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return makeMinimalStream();
			},
			currentStreamLabel: "microphone",
		});

		const stopFn = vi.fn<() => void>();
		mockRunTypegpu.mockResolvedValue(stopFn);

		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);

		await result.current.startMic();

		await waitFor(() => {
			expect(mockStartLevel).toHaveBeenCalledTimes(ONE_CALL);
		});
		await waitFor(() => {
			const FIRST_CALL_INDEX = 0;
			const FN_ARG_INDEX = 1;
			expect(typeof mockRunTypegpu.mock.calls[FIRST_CALL_INDEX]?.[FN_ARG_INDEX]).toBe("function");
			expect(result.current.status).toBe("running-typegpu");
			expect(result.current.renderInfo).toContain("TypeGPU + WebGPU");
		});
	});

	it("stop() invokes the runTypegpu stopFn and cleans up canvas/audio", async () => {
		const mockStopAudio = vi.fn(async (): Promise<void> => {
			await Promise.resolve();
		});
		const { canvas, stopCanvasSpy } = setup({
			startLevelUiTimer: vi.fn(),
			readSmoothedLevelNow: vi.fn(() => DEFAULT_LEVEL),
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return { getTracks: () => [], getAudioTracks: () => [] };
			},
			stop: mockStopAudio,
			currentStreamLabel: "microphone",
		});

		const stopFn = vi.fn<() => void>();
		// mockRunTypegpu resolves to the library-provided stop function (typed at runtime)
		mockRunTypegpu.mockResolvedValue(stopFn);

		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);
		await result.current.startMic();

		await waitFor(() => {
			expect(result.current.status).toBe("running-typegpu");
		});

		await result.current.stop();

		await waitFor(() => {
			// stopFn and stopCanvasSpy are invoked as side-effects of stop(); we only
			// need to ensure they were called (no args expected).
			expect(mockStopAudio).toHaveBeenCalledWith({ setStoppedStatus: false });
			expect(stopFn).toHaveBeenCalledWith();
			expect(stopCanvasSpy).toHaveBeenCalledWith();
			expect(result.current.status).toBe("stopped");
		});
	});

	it("startMic -> fallback Canvas2D path when TypeGPU is unavailable", async () => {
		const mockReadBytesAndLevel = vi.fn(() => ({
			bytes: new Uint8Array(SAMPLE_BYTES),
			level: 0.42,
		}));
		const { canvas, startCanvasSpy, getCapturedDraw } = setup({
			readBytesAndSmoothedLevelNow: mockReadBytesAndLevel,
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return makeMinimalStream();
			},
		});
		// Simulate TypeGPU path failing to trigger the Canvas2D fallback
		mockRunTypegpu.mockRejectedValueOnce(new Error("no WebGPU"));

		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);

		await result.current.startMic();

		await waitFor(() => {
			expect(result.current.status).toBe("running-fallback");
		});
		await waitFor(() => {
			expect(result.current.renderInfo).toContain("Canvas2D fallback");
		});
		// verify startCanvas was called with the canvas and a draw callback
		expect(startCanvasSpy).toHaveBeenCalledWith(
			expect.any(HTMLCanvasElement),
			expect.any(Function),
			expect.objectContaining({ loop: true }),
		);

		// assert the canvas animation was started and the fallback drawer was invoked
		expect(startCanvasSpy).toHaveBeenCalledWith(
			expect.any(HTMLCanvasElement),
			expect.any(Function),
			expect.objectContaining({ loop: true }),
		);

		// invoke the draw callback that `startCanvas` received (simulate one frame)
		const drawFn = getCapturedDraw();
		assertIsDrawFn(drawFn);
		const ctx = document.createElement("canvas").getContext("2d");
		assertIs2DContext(ctx);
		const FRAME_NUMBER = 1;
		drawFn(ctx, FRAME_NUMBER);

		expect(mockDrawFallback).toHaveBeenCalledTimes(ONE_CALL);
		// payload shape is exercised by the fallback drawer unit tests; here we
		// only verify the integration path ran.
	});

	it("startDeviceAudio mirrors tab/screen audio label in renderInfo", async () => {
		const { canvas } = setup({
			startLevelUiTimer: vi.fn(),
			stopLevelUiTimer: vi.fn(),
			readSmoothedLevelNow: vi.fn(() => DEFAULT_LEVEL),
			readBytesAndSmoothedLevelNow: () => ({
				bytes: new Uint8Array(FFT_SIZE),
				level: DEFAULT_LEVEL,
			}),
			resetLevel: vi.fn(),
			levelUiValue: 0,
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return undefined;
			},
			// return a truthy "stream-like" value so the hook proceeds to rendering
			startDeviceAudio: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return makeMinimalStream();
			},
			stop: async (): Promise<void> => {
				await Promise.resolve();
				return undefined;
			},
			selectedAudioInputDeviceId: "default",
			setSelectedAudioInputDeviceId: vi.fn(),
			audioInputDevicesRefreshKey: 0,
			status: "idle",
			errorMessage: undefined,
			currentStreamLabel: "tab/screen audio",
		});
		mockRunTypegpu.mockRejectedValue(new Error("no WebGPU"));

		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);

		await result.current.startDeviceAudio();

		await waitFor(() => {
			expect(result.current.renderInfo).toContain("tab/screen audio");
		});
		await waitFor(() => {
			expect(result.current.status).toBe("running-fallback");
		});
	});

	it("startMic with no canvas sets an error status/message", async () => {
		setup();
		const nullCanvasRef = {
			current: document.querySelector<HTMLCanvasElement>("#no-canvas"),
		} as RefObject<HTMLCanvasElement | null>;
		const { result } = renderHook(() => useTypegpuAudioViz(nullCanvasRef));

		await result.current.startMic();

		await waitFor(() => {
			expect(result.current.status).toBe("error");
		});
		await waitFor(() => {
			expect(result.current.errorMessage).toBe("Canvas not available");
		});
	});

	it("stop(options.setStoppedStatus=false) does not set status to stopped", async () => {
		// Start then stop with setStoppedStatus=false
		const { canvas } = setup({
			startMic: async (): Promise<MinimalMediaStream | undefined> => {
				await Promise.resolve();
				return makeMinimalStream();
			},
		});
		mockRunTypegpu.mockRejectedValueOnce(new Error("no WebGPU"));
		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);

		await result.current.startMic();

		await waitFor(() => {
			expect(result.current.status).toMatch(/running-(fallback|typegpu)/);
		});

		await result.current.stop({ setStoppedStatus: false });

		// ensure status does not transition to "stopped"
		await waitFor(() => {
			expect(result.current.status).not.toBe("stopped");
		});
	});
});
