import { useEffect, useRef, useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import typegpu from "typegpu";

import {
	clamp01,
	computeRmsLevelFromTimeDomainBytes,
	drawAudioVizFallbackFrame,
	getDisplayAudioStream,
	getMicStreamForDevice,
	resizeCanvasToDisplaySize,
	smoothValue,
} from "@/react/pages/demo/typegpuAudioVizDemoHelpers";
import TypegpuAudioVizDemoView from "@/react/pages/demo/TypegpuAudioVizDemoView";
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

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 360;
const ZERO = 0;
const ONE = 1;

const LEVEL_UI_INTERVAL_MS = 200;
const ANALYSER_FFT_SIZE = 2048;
const ANALYSER_SMOOTHING_TIME_CONSTANT = 0.85;
const LEVEL_SMOOTHING_ALPHA = 0.2;
const LEVEL_DECIMALS = 3;

export default function TypegpuAudioVizDemoPage(): ReactElement {
	const { t } = useTranslation();

	const [status, setStatus] = useState<DemoStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
	const [levelUiValue, setLevelUiValue] = useState<number>(ZERO);
	const [renderInfo, setRenderInfo] = useState<string | undefined>(undefined);
	const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState<string>("default");
	const [audioInputDevicesRefreshKey, setAudioInputDevicesRefreshKey] = useState<number>(ZERO);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const audioContextRef = useRef<AudioContext | undefined>(undefined);
	const analyserRef = useRef<AnalyserNode | undefined>(undefined);
	const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
	const timeDomainDataRef = useRef<Uint8Array<ArrayBuffer> | undefined>(undefined);
	const levelRef = useRef<number>(ZERO);

	const stopTypeGpuRef = useRef<(() => void) | undefined>(undefined);
	const stopUiTimerRef = useRef<(() => void) | undefined>(undefined);

	const { start: startCanvas, stop: stopCanvas } = useCanvasAnimation();

	function stopTypeGpuIfRunning(): void {
		const stopFn = stopTypeGpuRef.current;
		if (!stopFn) {
			return;
		}
		stopTypeGpuRef.current = undefined;
		stopFn();
	}

	function stopUiTimerIfRunning(): void {
		const stopFn = stopUiTimerRef.current;
		if (!stopFn) {
			return;
		}
		stopUiTimerRef.current = undefined;
		stopFn();
	}

	function computeLevelFromTimeDomainBytes(bytes: Uint8Array): number {
		return computeRmsLevelFromTimeDomainBytes(bytes);
	}

	function smoothLevel(nextRaw: number): number {
		const raw = clamp01(nextRaw);
		const previous = levelRef.current;
		const smoothed = smoothValue(previous, raw, LEVEL_SMOOTHING_ALPHA);
		levelRef.current = smoothed;
		return smoothed;
	}

	function readLevelNow(): number {
		const analyser = analyserRef.current;
		const bytes = timeDomainDataRef.current;
		if (!analyser || !bytes) {
			return ZERO;
		}
		analyser.getByteTimeDomainData(bytes);
		return computeLevelFromTimeDomainBytes(bytes);
	}

	function startLevelUiTimer(): void {
		stopUiTimerIfRunning();
		const uiTimer = globalThis.setInterval(() => {
			setLevelUiValue(levelRef.current);
		}, LEVEL_UI_INTERVAL_MS);
		stopUiTimerRef.current = (): void => {
			clearInterval(uiTimer);
		};
	}

	async function stopAll(options?: { setStoppedStatus: boolean }): Promise<void> {
		stopCanvas();
		stopTypeGpuIfRunning();
		stopUiTimerIfRunning();

		const stream = mediaStreamRef.current;
		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			mediaStreamRef.current = undefined;
		}

		analyserRef.current = undefined;
		timeDomainDataRef.current = undefined;

		const audioContext = audioContextRef.current;
		if (audioContext) {
			audioContextRef.current = undefined;
			await audioContext.close().catch(() => {
				// ignore
			});
		}

		levelRef.current = ZERO;
		setLevelUiValue(ZERO);
		setRenderInfo(undefined);
		setErrorMessage(undefined);
		if (options?.setStoppedStatus !== false) {
			setStatus("stopped");
		}
	}

	async function startMicAndRender(): Promise<void> {
		await startStreamAndRender(
			() => getMicStreamForDevice(selectedAudioInputDeviceId),
			"microphone",
		);
	}

	async function startDeviceAudioAndRender(): Promise<void> {
		await startStreamAndRender(getDisplayAudioStream, "tab/screen audio");
	}

	async function startStreamAndRender(
		getStream: () => Promise<MediaStream>,
		streamLabel: string,
	): Promise<void> {
		setErrorMessage(undefined);
		setRenderInfo(undefined);
		setStatus("requesting-mic");

		await stopAll({ setStoppedStatus: false });

		const canvas = canvasRef.current;
		if (!canvas) {
			setErrorMessage("Canvas not available");
			setStatus("error");
			return;
		}

		resizeCanvasToDisplaySize(canvas);

		const stream = await getStream().catch(async (error: unknown) => {
			await stopAll({ setStoppedStatus: false });
			setErrorMessage(String(error));
			setStatus("error");
			return undefined;
		});
		if (!stream) {
			return;
		}

		if (stream.getAudioTracks().length === ZERO) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			await stopAll({ setStoppedStatus: false });
			setErrorMessage(
				`No audio track received from ${streamLabel}. If you used screen sharing, ensure "Share audio" is enabled.`,
			);
			setStatus("error");
			return;
		}

		mediaStreamRef.current = stream;
		setAudioInputDevicesRefreshKey((key) => key + ONE);

		const AudioContextCtor: typeof AudioContext | undefined = Reflect.get(
			globalThis,
			"AudioContext",
		);
		if (AudioContextCtor === undefined) {
			await stopAll({ setStoppedStatus: false });
			setErrorMessage("This browser does not support AudioContext");
			setStatus("error");
			return;
		}
		const audioContext = new AudioContextCtor();
		audioContextRef.current = audioContext;

		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = ANALYSER_FFT_SIZE;
		analyser.smoothingTimeConstant = ANALYSER_SMOOTHING_TIME_CONSTANT;
		source.connect(analyser);

		analyserRef.current = analyser;
		timeDomainDataRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));

		setStatus("mic-ready");
		setStatus("starting-render");

		startLevelUiTimer();
		smoothLevel(readLevelNow());

		const stopFn = await runTypeGpuAudioVizDemo(canvas, () => smoothLevel(readLevelNow()), {
			typegpuModule: typegpu,
			onFinish: () => {
				stopUiTimerIfRunning();
			},
		}).catch((error: unknown) => {
			console.warn("TypeGPU/WebGPU path failed, falling back to Canvas2D:", error);
			return undefined;
		});

		if (stopFn !== undefined) {
			stopTypeGpuRef.current = stopFn;
			setRenderInfo(`Rendering via TypeGPU + WebGPU (${streamLabel})`);
			setStatus("running-typegpu");
			return;
		}

		setRenderInfo(`Rendering via Canvas2D fallback (${streamLabel})`);
		setStatus("running-fallback");

		startCanvas(
			canvas,
			(ctx) => {
				const analyserNow = analyserRef.current;
				const bytes = timeDomainDataRef.current;
				if (!analyserNow || !bytes) {
					return;
				}
				analyserNow.getByteTimeDomainData(bytes);
				const level = smoothLevel(computeLevelFromTimeDomainBytes(bytes));

				drawAudioVizFallbackFrame({
					ctx,
					canvas,
					bytes,
					level,
					levelDecimals: LEVEL_DECIMALS,
				});
			},
			{
				loop: true,
				duration: 0,
			},
		);
	}

	useEffect(
		(): (() => void) => (): void => {
			stopCanvas();
			stopTypeGpuIfRunning();
			stopUiTimerIfRunning();

			const stream = mediaStreamRef.current;
			if (stream) {
				for (const track of stream.getTracks()) {
					track.stop();
				}
				mediaStreamRef.current = undefined;
			}

			analyserRef.current = undefined;
			timeDomainDataRef.current = undefined;

			const audioContext = audioContextRef.current;
			if (audioContext) {
				audioContextRef.current = undefined;
				void audioContext.close();
			}
		},
		[stopCanvas],
	);

	useEffect(() => {
		function onResize(): void {
			const canvas = canvasRef.current;
			if (!canvas) {
				return;
			}
			resizeCanvasToDisplaySize(canvas);
		}
		globalThis.addEventListener("resize", onResize);
		return (): void => {
			globalThis.removeEventListener("resize", onResize);
		};
	}, []);

	return (
		<TypegpuAudioVizDemoView
			title={t("pages.typegpuAudioVizDemo.title", "TypeGPU Audio Viz Demo")}
			subtitle={t(
				"pages.typegpuAudioVizDemo.subtitle",
				"Proves we can capture a live audio signal and drive a GPU visualization from it.",
			)}
			status={status}
			levelUiValue={levelUiValue}
			levelDecimals={LEVEL_DECIMALS}
			renderInfo={renderInfo}
			errorMessage={errorMessage}
			selectedAudioInputDeviceId={selectedAudioInputDeviceId}
			onChangeSelectedAudioInputDeviceId={setSelectedAudioInputDeviceId}
			audioInputDevicesRefreshKey={audioInputDevicesRefreshKey}
			onStartMic={startMicAndRender}
			onStartDeviceAudio={startDeviceAudioAndRender}
			onStop={stopAll}
			canvasRef={(node) => {
				canvasRef.current = node;
			}}
			canvasWidth={CANVAS_WIDTH}
			canvasHeight={CANVAS_HEIGHT}
		/>
	);
}
