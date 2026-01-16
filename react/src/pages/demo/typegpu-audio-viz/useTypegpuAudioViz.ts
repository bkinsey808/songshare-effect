import { useEffect, useRef, useState } from "react";
import typegpu from "typegpu";

import useAudioVizInput from "@/react/audio/useAudioVizInput";
import drawAudioVizFallbackFrame from "@/react/pages/demo/typegpu-audio-viz/drawAudioVizFallbackFrame";
import resizeCanvasToDisplaySize from "@/react/typegpu/resizeCanvasToDisplaySize";
import runTypeGpuAudioVizDemo from "@/react/typegpu/runTypeGpuAudioVizDemo";
import { useCanvasAnimation } from "@/react/typegpu/useCanvasAnimation";

type DemoStatus =
	| "idle"
	| "requesting-mic"
	| "mic-ready"
	| "starting-render"
	| "running-typegpu"
	| "running-fallback"
	| "stopped"
	| "error";

const LEVEL_UI_INTERVAL_MS = 200;
const LEVEL_SMOOTHING_ALPHA = 0.2;
const LEVEL_DECIMALS = 3;
const ZERO = 0;

export default function useTypegpuAudioViz(canvasRef: React.RefObject<HTMLCanvasElement | null>): {
	status: DemoStatus;
	errorMessage: string | undefined;
	renderInfo: string | undefined;
	selectedAudioInputDeviceId: string;
	setSelectedAudioInputDeviceId: (id: string) => void;
	audioInputDevicesRefreshKey: number;
	levelUiValue: number;
	startMic: () => Promise<void>;
	startDeviceAudio: () => Promise<void>;
	stop: (options?: { setStoppedStatus?: boolean }) => Promise<void>;
} {
	const { start: startCanvas, stop: stopCanvas } = useCanvasAnimation();

	const {
		startLevelUiTimer,
		stopLevelUiTimer,
		readSmoothedLevelNow,
		readBytesAndSmoothedLevelNow,
		resetLevel,
		levelUiValue,
		startMic: startAudioMic,
		startDeviceAudio: startAudioDeviceAudio,
		stop: stopAudio,
		selectedAudioInputDeviceId,
		setSelectedAudioInputDeviceId,
		audioInputDevicesRefreshKey,
		status: audioStatus,
		errorMessage: audioErrorMessage,
		currentStreamLabel,
	} = useAudioVizInput({
		uiIntervalMs: LEVEL_UI_INTERVAL_MS,
		smoothingAlpha: LEVEL_SMOOTHING_ALPHA,
	});

	const [status, setStatus] = useState<DemoStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
	const [renderInfo, setRenderInfo] = useState<string | undefined>(undefined);

	const stopTypeGpuRef = useRef<(() => void) | undefined>(undefined);

	function stopTypeGpuIfRunning(): void {
		const stopFn = stopTypeGpuRef.current;
		if (!stopFn) {
			return;
		}
		stopTypeGpuRef.current = undefined;
		stopFn();
	}

	async function stop(options?: { setStoppedStatus?: boolean }): Promise<void> {
		stopCanvas();
		stopTypeGpuIfRunning();
		resetLevel();

		await stopAudio(options);

		setRenderInfo(undefined);
		setErrorMessage(undefined);
		if (options?.setStoppedStatus !== false) {
			setStatus("stopped");
		}
	}

	async function startMic(): Promise<void> {
		setErrorMessage(undefined);
		setRenderInfo(undefined);
		setStatus("requesting-mic");

		await stop({ setStoppedStatus: false });

		const canvas = canvasRef.current;
		if (!canvas) {
			setErrorMessage("Canvas not available");
			setStatus("error");
			return;
		}

		resizeCanvasToDisplaySize(canvas);

		const stream = await startAudioMic();
		if (!stream) {
			// hook should set its own error message/status
			setStatus("error");
			return;
		}

		setStatus("starting-render");

		startLevelUiTimer();
		// Prime the level value for the render paths
		readSmoothedLevelNow();

		const stopFn = await runTypeGpuAudioVizDemo(canvas, () => readSmoothedLevelNow(), {
			typegpuModule: typegpu,
			onFinish: () => {
				stopLevelUiTimer();
			},
		}).catch((error: unknown) => {
			console.warn("TypeGPU/WebGPU path failed, falling back to Canvas2D:", error);
			return undefined;
		});

		if (stopFn !== undefined) {
			stopTypeGpuRef.current = stopFn;
			setRenderInfo(`Rendering via TypeGPU + WebGPU (${currentStreamLabel ?? "microphone"})`);
			setStatus("running-typegpu");
			return;
		}

		setRenderInfo(`Rendering via Canvas2D fallback (${currentStreamLabel ?? "microphone"})`);
		setStatus("running-fallback");

		startCanvas(
			canvas,
			(ctx) => {
				const data = readBytesAndSmoothedLevelNow();
				if (!data) {
					return;
				}

				drawAudioVizFallbackFrame({
					ctx,
					canvas,
					bytes: data.bytes,
					level: data.level,
					levelDecimals: LEVEL_DECIMALS,
				});
			},
			{
				loop: true,
				duration: 0,
			},
		);
	}

	async function startDeviceAudio(): Promise<void> {
		setErrorMessage(undefined);
		setRenderInfo(undefined);
		setStatus("requesting-mic");

		await stop({ setStoppedStatus: false });

		const canvas = canvasRef.current;
		if (!canvas) {
			setErrorMessage("Canvas not available");
			setStatus("error");
			return;
		}

		resizeCanvasToDisplaySize(canvas);

		const stream = await startAudioDeviceAudio();
		if (!stream) {
			setStatus("error");
			return;
		}

		setStatus("starting-render");

		startLevelUiTimer();
		// Prime the level value for the render paths
		readSmoothedLevelNow();

		const stopFn = await runTypeGpuAudioVizDemo(canvas, () => readSmoothedLevelNow(), {
			typegpuModule: typegpu,
			onFinish: () => {
				stopLevelUiTimer();
			},
		}).catch((error: unknown) => {
			console.warn("TypeGPU/WebGPU path failed, falling back to Canvas2D:", error);
			return undefined;
		});

		if (stopFn !== undefined) {
			stopTypeGpuRef.current = stopFn;
			setRenderInfo(`Rendering via TypeGPU + WebGPU (${currentStreamLabel ?? "tab/screen audio"})`);
			setStatus("running-typegpu");
			return;
		}

		setRenderInfo(`Rendering via Canvas2D fallback (${currentStreamLabel ?? "tab/screen audio"})`);
		setStatus("running-fallback");

		startCanvas(
			canvas,
			(ctx) => {
				const data = readBytesAndSmoothedLevelNow();
				if (!data) {
					return;
				}

				drawAudioVizFallbackFrame({
					ctx,
					canvas,
					bytes: data.bytes,
					level: data.level,
					levelDecimals: LEVEL_DECIMALS,
				});
			},
			{
				loop: true,
				duration: 0,
			},
		);
	}

	useEffect(() => {
		// Mirror errors from the capture hook into the page UI
		setErrorMessage(audioErrorMessage);
		if (
			audioStatus === "requesting-mic" ||
			audioStatus === "mic-ready" ||
			audioStatus === "starting-render" ||
			audioStatus === "stopped" ||
			audioStatus === "error" ||
			audioStatus === "idle"
		) {
			setStatus(audioStatus as DemoStatus);
		}
	}, [audioErrorMessage, audioStatus]);

	useEffect((): (() => void) => {
		stopCanvas();
		stopTypeGpuIfRunning();
		stopLevelUiTimer();
		void stopAudio();
		return (): void => undefined;
	}, [stopCanvas, stopAudio, stopLevelUiTimer]);

	return {
		status,
		errorMessage,
		renderInfo,
		selectedAudioInputDeviceId,
		setSelectedAudioInputDeviceId,
		audioInputDevicesRefreshKey,
		levelUiValue: levelUiValue ?? ZERO,
		startMic,
		startDeviceAudio,
		stop,
	};
}

export type TypegpuAudioVizDemoStatus = DemoStatus;
