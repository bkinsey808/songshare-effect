import type { Ref, ReactElement } from "react";
import type { PresetItem } from "./presetHelpers";

type Props = {
  presets: PresetItem[];
  selectedPreset: string | undefined;
  setSelectedPreset: (name?: string) => void;
  monitoring: boolean;
  setMonitoring: (value: boolean | ((prev: boolean) => boolean)) => void;
  audioInputDevices: MediaDeviceInfo[];
  selectedDeviceId: string | undefined;
  setSelectedDeviceId: (id?: string) => void;
  doAttachMic: (deviceId?: string) => Promise<boolean>;
  testSelectedDevice: () => Promise<boolean>;
  isCapturingSystem: boolean;
  doAttachSystemAudio: () => Promise<boolean>;
  doStopSystemAudio: () => void;
  errorMessage: string | undefined;
  canvasRef: Ref<HTMLCanvasElement> | null;
  audioRef: Ref<HTMLAudioElement> | null;
};

const DEFAULT_CANVAS_HEIGHT = 420;

export default function ButterchurnLiveVisualizerUi({
  presets,
  selectedPreset,
  setSelectedPreset,
  monitoring,
  setMonitoring,
  audioInputDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  doAttachMic,
  testSelectedDevice,
  isCapturingSystem,
  doAttachSystemAudio,
  doStopSystemAudio,
  errorMessage,
  canvasRef,
  audioRef,
}: Props): ReactElement {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="preset-select" className="text-sm text-gray-300">
          Preset
        </label>
        <select
          id="preset-select"
          value={selectedPreset ?? ""}
          onChange={(event) => {
            setSelectedPreset(event.target.value || undefined);
          }}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white"
        >
          {presets.map((presetObj) => (
            <option key={presetObj.name} value={presetObj.name}>
              {presetObj.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setMonitoring((previous) => !previous);
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          {monitoring ? "Mute monitor" : "Monitor"}
        </button>

        <label htmlFor="audio-input-select" className="text-sm text-gray-300">
          Input
        </label>
        <select
          id="audio-input-select"
          value={selectedDeviceId ?? ""}
          onChange={(event) => {
            const value = (event.target as HTMLSelectElement).value || undefined;
            try {
              setSelectedDeviceId(value);
            } catch {
              try {
                setSelectedDeviceId(undefined);
              } catch {
                // ignore
              }
            }
          }}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white"
        >
          <option value="">Default input</option>
          {audioInputDevices.map((dev) => (
            <option key={dev.deviceId} value={dev.deviceId}>
              {dev.label || dev.deviceId}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            void doAttachMic(selectedDeviceId);
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          Use Microphone / Device
        </button>

        <button
          type="button"
          onClick={() => {
            void testSelectedDevice();
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          Test device
        </button>

        <button
          type="button"
          onClick={() => {
            if (isCapturingSystem) {
              doStopSystemAudio();
            } else {
              void doAttachSystemAudio();
            }
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          {isCapturingSystem ? "Stop capture" : "Capture system/tab audio"}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black p-0" style={{ height: DEFAULT_CANVAS_HEIGHT }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <audio ref={audioRef} controls className="w-full bg-gray-900 text-white">
        <track kind="captions" srcLang="en" label="captions" />
      </audio>

      {errorMessage !== undefined && errorMessage !== "" ? (
        <div className="text-red-400 text-sm">{errorMessage}</div>
      ) : undefined}
    </div>
  );
}
