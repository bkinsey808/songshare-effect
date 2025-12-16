import { type ReactElement, type RefObject, useEffect, useRef } from "react";
import { clientDebug } from "@/react/utils/clientLogger";

type PresetItem = { name: string; preset: unknown };

function LevelMeter({ analyserRef }: { analyserRef?: RefObject<AnalyserNode | undefined> | undefined }): ReactElement | undefined {
  // Simple meter that displays signal level from the analyser node (if present)
  const meterRef = useRef<HTMLDivElement | null>(null);

  useEffect((): (() => void) => {
    let rafId = 0;
    const node = analyserRef?.current;
    if (!node || !meterRef.current) {
      return (): void => undefined;
    }

    const analyser = node;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const SAMPLE_CENTER = 128;
    const EMPTY_BYTE = 0;
    const MAX_PCT = 1;
    const SCALE = 4;
    const PERCENT = 100;

    function draw(): void {
      let sum = 0;
      let readOk = false;
      try {
        analyser.getByteTimeDomainData(data);
        readOk = true;
      } catch {
        // ignore
      }

      if (readOk) {
        // prefer-for-of rule disabled because some runtimes and the react-compiler
        // have trouble with value-blocks inside try/catch; indexed loop avoids that
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        const INDEX_INCR = 1;
        for (let idx = 0; idx < data.length; idx += INDEX_INCR) {
          const byte = data[idx] ?? EMPTY_BYTE;
          const val = (byte - SAMPLE_CENTER) / SAMPLE_CENTER;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / data.length);
        const pct = Math.min(MAX_PCT, rms * SCALE); // scale for visibility
        if (meterRef.current) {
          meterRef.current.style.width = `${Math.round(pct * PERCENT)}%`;
        }
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    return (): void => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [analyserRef]);

  return (
    <div className="ml-3 w-40">
      <div className="h-3 w-full bg-gray-800 rounded overflow-hidden">
        <div ref={meterRef} className="h-3 bg-green-500" style={{ width: 0 }} />
      </div>
    </div>
  );
}

export default function ButterchurnVisualizerUi(props: {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  presets: PresetItem[];
  selectedPreset: string | undefined;
  setSelectedPreset: (value: string) => void;
  monitoring: boolean;
  setMonitoring: (value: boolean) => void;
  attachAudioInput: () => Promise<boolean> | void;
  testDevice?: () => Promise<boolean> | void;
  /** Optional analyser used for a small level meter to show incoming audio */
  analyserRef?: React.RefObject<AnalyserNode | undefined> | undefined;
  /**
   * Optional list of available audio input devices (virtual loopback devices
   * often appear here once permission has been granted).
   */
  audioDevices?: MediaDeviceInfo[] | undefined;
  /**
   * Device id currently selected by the user (passed by parent when invoking the attachAudioInput helper).
   */
  selectedDeviceId?: string | undefined;
  /**
   * Optional callback that updates the chosen device id in the parent component.
   */
  setSelectedDeviceId?: (value: string | undefined) => void;
  systemCapturing: boolean;
  stopSystemAudio: () => void;
  attachSystemAudio: () => Promise<boolean> | void;
  error: string | undefined;
}): ReactElement {
  const {
    containerRef,
    canvasRef,
    audioRef,
    presets,
    selectedPreset,
    setSelectedPreset,
    monitoring,
    setMonitoring,
    attachAudioInput,
    analyserRef,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    systemCapturing,
    stopSystemAudio,
    attachSystemAudio,
    error,
  } = props;

  // LevelMeter moved to top-level to satisfy Rules of Hooks

  useEffect(() => {
    if (error !== undefined && error !== "") {
      clientDebug("ButterchurnVisualizerUi: error prop changed:", error);
    }
  }, [error]);

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="preset-select" className="text-sm text-gray-300">
          Preset
        </label>
        <select
          className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white"
          value={selectedPreset ?? ""}
          id="preset-select"
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedPreset(event.target.value);
          }}
        >
          {presets.map((presetItem) => (
            <option key={presetItem.name} value={presetItem.name}>
              {presetItem.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setMonitoring(!monitoring);
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          {monitoring ? "Mute monitor" : "Monitor audio"}
        </button>

        <label htmlFor="device-select" className="text-sm text-gray-300">
          Input
        </label>
        <select
          id="device-select"
          value={selectedDeviceId ?? ""}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            // When the user chooses a device, call the optional setter in the parent.
            // If they clear selection, pass undefined to indicate default device usage.
            const setter = setSelectedDeviceId;
            const value = (event.target as HTMLSelectElement).value || undefined;
            if (typeof setter === "function") {
              try {
                setter(value);
              } catch {
                try {
                  setter(undefined);
                } catch {
                  // ignore
                }
              }
            }
          }}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white"
        >
          <option value="">Default</option>
          {audioDevices?.map((dev) => (
            <option key={dev.deviceId} value={dev.deviceId}>
              {dev.label || dev.deviceId}
            </option>
          ))}
        </select>

        {/* Hint + auto-fix when an output device is selected by mistake */}
        {selectedDeviceId !== undefined && selectedDeviceId !== "" && audioDevices ? (
          (() => {
            const selected = audioDevices.find((device) => device.deviceId === selectedDeviceId);
            const label = selected ? String(selected.label || "") : "";
            const labelLower = label.toLowerCase();
            // It's an output if it has "out" but IS NOT a virtual cable/voicemeeter input
            const isVirtual = /voicemeeter|vb-audio|virtual|cable|input|vaio/.test(labelLower);
            const looksLikeOutput = labelLower.includes("out") && !isVirtual;

            if (looksLikeOutput) {
              return (
                <div className="ml-3 text-sm text-yellow-300">
                  <div>Selected device appears to be an output device and may not capture audio.</div>
                  <div>
                      Try selecting a virtual input (e.g., &quot;Voicemeeter Input&quot;, &quot;VB‑Audio CABLE Input&quot;) or use &quot;Capture system/tab audio&quot;.
                  </div>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        // Find a likely input device: prefer labels containing common keywords
                        const preferred = audioDevices.find((dev) => {
                          const labelLower = String(dev.label || "").toLowerCase();
                          return (/voicemeeter|vb-audio|virtual|cable|input|vaio/.test(labelLower) && !labelLower.includes("out"));
                        });
                        if (preferred && typeof setSelectedDeviceId === "function") {
                          try {
                            setSelectedDeviceId(String(preferred.deviceId));
                          } catch {
                            // ignore
                          }
                        }
                      }}
                      className="rounded border border-yellow-600 px-2 py-1 text-xs text-yellow-200"
                    >
                      Auto-select likely input
                    </button>
                  </div>
                </div>
              );
            }
              return undefined;
          })()
        ) : undefined}

        {/* Level meter shows incoming audio signal if analyser node is connected */}
        <LevelMeter analyserRef={analyserRef} />

        <button
          type="button"
          onClick={() => void attachAudioInput()}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          Start Listening
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof props.testDevice === "function") {
              void props.testDevice();
            }
          }}
          className="ml-2 rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          Test device
        </button>

        <button
          type="button"
          onClick={() => {
            if (systemCapturing) {
              stopSystemAudio();
            } else {
              void attachSystemAudio();
            }
          }}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-white"
        >
          {systemCapturing ? "Stop system capture" : "Capture system/tab audio"}
        </button>
      </div>

      <div
        className="rounded-lg border border-white/10 bg-black p-0"
        style={{ height: 420 }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <audio ref={audioRef} controls className="w-full bg-gray-900 text-white">
        <track kind="captions" />
      </audio>

      {error !== undefined && error !== "" ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : undefined}
    </div>
  );
}
