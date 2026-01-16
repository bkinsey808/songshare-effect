import { useRef, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import TypegpuAudioVizDemoView from "@/react/pages/demo/typegpu-audio-viz/TypegpuAudioVizDemoView";
import useTypegpuAudioViz from "@/react/pages/demo/typegpu-audio-viz/useTypegpuAudioViz";
import useResizeCanvasToDisplaySizeOnWindowResize from "@/react/typegpu/useResizeCanvasToDisplaySizeOnWindowResize";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 360;
const ZERO = 0;

const LEVEL_DECIMALS = 3;

export default function TypegpuAudioVizDemoPage(): ReactElement {
	const { t } = useTranslation();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const {
		status,
		errorMessage,
		renderInfo,
		selectedAudioInputDeviceId,
		setSelectedAudioInputDeviceId,
		audioInputDevicesRefreshKey,
		levelUiValue,
		startMic: startMicAndRender,
		startDeviceAudio: startDeviceAudioAndRender,
		stop: stopAll,
	} = useTypegpuAudioViz(canvasRef);

	useResizeCanvasToDisplaySizeOnWindowResize(canvasRef);

	return (
		<TypegpuAudioVizDemoView
			title={t("pages.typegpuAudioVizDemo.title", "TypeGPU Audio Viz Demo")}
			subtitle={t(
				"pages.typegpuAudioVizDemo.subtitle",
				"Proves we can capture a live audio signal and drive a GPU visualization from it.",
			)}
			status={status}
			levelUiValue={levelUiValue ?? ZERO}
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
