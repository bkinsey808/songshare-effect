import { type ReactElement } from "react";

import AudioInputDeviceSelect from "@/react/audio/AudioInputDeviceSelect";
import DemoNavigation from "@/react/demo/DemoNavigation";

type Props = {
	title: string;
	subtitle: string;
	status: string;
	levelUiValue: number;
	levelDecimals: number;
	renderInfo: string | undefined;
	errorMessage: string | undefined;
	selectedAudioInputDeviceId: string;
	onChangeSelectedAudioInputDeviceId: (nextId: string) => void;
	audioInputDevicesRefreshKey: number;
	onStartMic: () => Promise<void>;
	onStartDeviceAudio: () => Promise<void>;
	onStop: () => Promise<void>;
	canvasRef: (node: HTMLCanvasElement | null) => void;
	canvasWidth: number;
	canvasHeight: number;
};

export default function TypegpuAudioVizDemoView({
	title,
	subtitle,
	status,
	levelUiValue,
	levelDecimals,
	renderInfo,
	errorMessage,
	selectedAudioInputDeviceId,
	onChangeSelectedAudioInputDeviceId,
	audioInputDevicesRefreshKey,
	onStartMic,
	onStartDeviceAudio,
	onStop,
	canvasRef,
	canvasWidth,
	canvasHeight,
}: Props): ReactElement {
	const isBusy =
		status === "requesting-mic" ||
		status === "starting-render" ||
		status === "running-typegpu" ||
		status === "running-fallback";
	const canStop = status !== "idle" && status !== "stopped" && status !== "error";

	return (
		<div>
			<div className="mb-10 text-center">
				<h1 className="mb-4 text-4xl font-bold">🎙️ {title}</h1>
				<p className="text-gray-400">{subtitle}</p>
			</div>
			<DemoNavigation />

			<section className="rounded-lg border border-white/10 bg-white/5 p-6">
				<h2 className="mb-4 text-2xl font-bold">🔊 Audio input</h2>
				<p className="text-gray-300">
					Use <strong>Start microphone</strong> for mic input, or <strong>Capture tab audio</strong>{" "}
					to visualize audio from a shared tab/screen.
				</p>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<AudioInputDeviceSelect
						value={selectedAudioInputDeviceId}
						onChange={onChangeSelectedAudioInputDeviceId}
						refreshKey={audioInputDevicesRefreshKey}
					/>
				</div>

				<div className="mt-6 flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-4">
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => {
								void onStartMic();
							}}
							disabled={isBusy}
						>
							Start microphone
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded border border-white/10 bg-transparent px-4 py-2 text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => {
								void onStartDeviceAudio();
							}}
							disabled={isBusy}
						>
							Capture tab audio
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded border border-white/10 bg-transparent px-4 py-2 text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={() => {
								void onStop();
							}}
							disabled={!canStop}
						>
							Stop
						</button>
					</div>

					<div className="rounded bg-gray-900 p-4 text-sm text-gray-300">
						<div>
							<strong>Status:</strong> {status}
						</div>
						<div className="mt-2">
							<strong>Mic level:</strong> {levelUiValue.toFixed(levelDecimals)}
						</div>
						{renderInfo === undefined ? undefined : (
							<div className="mt-2">
								<strong>Render:</strong> {renderInfo}
							</div>
						)}
						{errorMessage === undefined ? undefined : (
							<div className="mt-2 text-red-300">
								<strong>Error:</strong> {errorMessage}
							</div>
						)}
					</div>

					<div className="mt-4 h-60 w-full overflow-hidden rounded border border-gray-700">
						<canvas
							ref={canvasRef}
							width={canvasWidth}
							height={canvasHeight}
							className="h-full w-full"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
