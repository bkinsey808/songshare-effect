import type { RefObject } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MinimalMediaStream } from "@/react/audio/types";

import useAudioVizInput from "@/react/audio/useAudioVizInput";
import resizeCanvasToDisplaySize from "@/react/canvas/resizeCanvasToDisplaySize";
import { useCanvasAnimation } from "@/react/canvas/useCanvasAnimation";
import drawAudioVizFallbackFrame from "@/react/pages/demo/typegpu-audio-viz/drawAudioVizFallbackFrame";
import runTypeGpuAudioVizDemo from "@/react/typegpu/runTypeGpuAudioVizDemo";

import useTypegpuAudioViz from "./useTypegpuAudioViz";

// Mocks for downstream dependencies — tests assert interactions rather than
// exercising heavy WebGPU/canvas logic.
/*
  NOTE: this test file intentionally uses several runtime-shaped mocks and
  partial objects to exercise fallback and integration paths. To keep
  the assertions readable and focused on behavior we permit a few
  narrow, test-only lint/type exceptions below.
*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion, jest/prefer-called-with, unicorn/no-null */
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

describe("useTypegpuAudioViz (behavior)", () => {
	const DEFAULT_LEVEL = 0;
	const FFT_SIZE = 16;
	// eslint-disable-next-line no-magic-numbers -- test fixture values
	const SAMPLE_BYTES = [1, 2, 3] as const;

	function setup(overrides: Partial<Partial<ReturnType<typeof useAudioVizInput>>> = {}): {
		canvas: HTMLCanvasElement;
		startCanvasSpy: ReturnType<typeof vi.fn>;
		stopCanvasSpy: ReturnType<typeof vi.fn>;
	} {
		vi.clearAllMocks();
		const canvas = document.createElement("canvas");
		const startCanvasSpy = vi.fn();
		const stopCanvasSpy = vi.fn();
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
		return { canvas, startCanvasSpy, stopCanvasSpy };
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

		// eslint-disable-next-line unicorn/no-null -- explicit test-only null ref for verifying error path
		const nullCanvasRef = { current: null } as RefObject<HTMLCanvasElement | null>;
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

		const stopFn = vi.fn() as unknown as Awaited<ReturnType<typeof runTypeGpuAudioVizDemo>>;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test shim for native API
		mockRunTypegpu.mockResolvedValue(stopFn);

		const { result } = renderHook(() =>
			useTypegpuAudioViz({ current: canvas } as RefObject<HTMLCanvasElement>),
		);

		await result.current.startMic();

		/* eslint-disable-next-line jest/prefer-called-with -- no args expected; presence only */
		await waitFor(() => {
			expect(mockStartLevel).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockRunTypegpu).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				expect.any(Function),
				expect.objectContaining({ typegpuModule: expect.anything() }),
			);
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

		const stopFn = vi.fn();
		// mockRunTypegpu resolves to the library-provided stop function (typed at runtime)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- test shim for native API
		mockRunTypegpu.mockResolvedValue(
			stopFn as unknown as Awaited<ReturnType<typeof runTypeGpuAudioVizDemo>>,
		);

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
			/* eslint-disable-next-line jest/prefer-called-with */
			expect(stopFn).toHaveBeenCalled();
			/* eslint-disable-next-line jest/prefer-called-with */
			expect(mockStopAudio).toHaveBeenCalled();
			/* eslint-disable-next-line jest/prefer-called-with */
			expect(stopCanvasSpy).toHaveBeenCalled();
			expect(result.current.status).toBe("stopped");
		});
	});

	it("startMic -> fallback Canvas2D path when TypeGPU is unavailable", async () => {
		const mockReadBytesAndLevel = vi.fn(() => ({
			bytes: new Uint8Array(SAMPLE_BYTES),
			level: 0.42,
		}));
		const { canvas, startCanvasSpy } = setup({
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
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-magic-numbers -- test shim to invoke captured callback */
		const startCall = startCanvasSpy.mock.calls[0] as unknown as [unknown, unknown];
		const [, drawFn] = startCall as [unknown, (ctx: CanvasRenderingContext2D) => void];
		expect(typeof drawFn).toBe("function");
		const fakeCtx = { foo: "bar" } as unknown as CanvasRenderingContext2D;
		drawFn(fakeCtx);

		/* eslint-disable-next-line jest/prefer-called-with -- verifying side-effect occurred */
		expect(mockDrawFallback).toHaveBeenCalled();
		/* eslint-disable-next-line jest/prefer-called-with -- no arg expectation, presence-only check */
		expect(mockReadBytesAndLevel).toHaveBeenCalled();
		// payload shape is exercised by the fallback drawer unit tests; here we
		// only verify the integration path ran.
	});

	it("startDeviceAudio mirrors tab/screen audio label in renderInfo", async () => {
		const { canvas } = setup();
		mockRunTypegpu.mockRejectedValue(new Error("no WebGPU"));
		mockUseAudioVizInput.mockReturnValueOnce({
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
		} as unknown as ReturnType<typeof useAudioVizInput>); // eslint-disable-line @typescript-eslint/no-unsafe-assignment -- intentional test shim

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
		// eslint-disable-next-line unicorn/no-null -- explicit test-only null ref
		const nullCanvasRef = { current: null } as RefObject<HTMLCanvasElement | null>;
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
