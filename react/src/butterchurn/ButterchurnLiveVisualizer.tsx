/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/strict-boolean-expressions */
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";

/*
 * Use static imports here to avoid the dev-time build error from the
 * react-compiler transform when encountering dynamic `import()` expressions.
 * These packages are already included as test/dev deps and loading them
 * statically keeps the editor/dev server from showing the overlay which
 * prevented the dashboard from rendering during tests.
 */
import butterchurnModule from "butterchurn";
/* eslint-disable unicorn/prefer-add-event-listener */
import presetsModuleDefault from "butterchurn-presets";
import { buildNormalizedPresets as buildNormalizedPresetsHelper } from "@/react/butterchurn/presetHelpers";
import useAudioInputDevices from "@/react/butterchurn/useAudioInputDevices";
import testDevice from "@/react/butterchurn/audioDeviceHelpers";
import ButterchurnLiveVisualizerUi from "@/react/butterchurn/ButterchurnLiveVisualizerUi";
import { clientDebug } from "@/react/utils/clientLogger";
// AudioContext creation is deferred until attach helpers (see attachSystemAudio/attachAudioInput)
// import ensureAudioContextHelper from "@/react/butterchurn/ensureAudioContext";
import useButterchurnVisualizer from "@/react/butterchurn/useButterchurnVisualizer";
import attachAudioInputHelper from "@/react/butterchurn/attachAudioInput";
import type { AttachAudioInputOptions } from "@/react/butterchurn/audioTypes";
import attachSystemAudioHelper from "@/react/butterchurn/attachSystemAudio";
import stopSystemAudioHelper from "@/react/butterchurn/stopSystemAudio";

// Minimal runtime types for butterchurn module
type ButterchurnLib = {
  createVisualizer?: (
    canvas: HTMLCanvasElement,
    ctx: AudioContext,
    analyser: AnalyserNode,
    opts?: unknown,
  ) => {
    loadPreset?: (preset: unknown) => void;
    render?: () => void;
    setRendererSize?: (width: number, height: number, scale?: number) => void;
    destroy?: () => void;
  };
};

type Preset = { name: string; preset: unknown };

// hook computes pixel ratio where needed

// oxlint-disable max-lines-per-function
export default function ButterchurnLiveVisualizer(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const visualizerRef = useRef<
    ReturnType<NonNullable<ButterchurnLib["createVisualizer"]>> | undefined
  >(undefined);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | undefined>(
    undefined,
  );

  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isCapturingSystem, setIsCapturingSystem] = useState(false);
  const [monitoring, setMonitoring] = useState(false);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const { audioInputDevices, setAudioInputDevices } = useAudioInputDevices(
    selectedDeviceId,
    (id?: string) => {
      try {
        setSelectedDeviceId(id);
      } catch {
        // ignore
      }
    },
  );

  

  // Load library + presets at mount
  useEffect(() => {
    // normalize presets and butterchurn lib using shared helper
    const { normalized, firstName, libNormalized } = buildNormalizedPresetsHelper(
      presetsModuleDefault,
      butterchurnModule,
    ) as { normalized: Preset[]; firstName?: string; libNormalized: unknown };

    setPresets(normalized);
    if (firstName) {
      setSelectedPreset(firstName);
    }

    try {
      const globalContext = globalThis as typeof globalThis & {
        __butterchurn_lib?: unknown;
      };
      if (libNormalized !== undefined) {
        globalContext.__butterchurn_lib = libNormalized as ButterchurnLib;
      }
      clientDebug("Live: __butterchurn_lib normalized and set:", libNormalized);
    } catch (error) {
      setErrorMessage("Failed to expose butterchurn library globally.");
      console.warn(error);
    }

    // Defer AudioContext creation until the user initiates audio capture
    // (e.g., via capture button or attaching microphone). Creating an
    // AudioContext on mount may trigger browser autoplay restrictions and
    // produce noisy console warnings in browsers that require a user
    // gesture to start audio. The attach helpers (attachAudioInput /
    // attachSystemAudio) will call ensureAudioContext when needed.
  }, []);

  function doAttachMic(deviceId?: string): Promise<boolean> {
    const baseOptions: AttachAudioInputOptions = {
      audioContextRef,
      analyserRef,
      sourceNodeRef,
      debug: clientDebug,
      recordError: (msg) => {
        clientDebug("ButterchurnLiveVisualizer: error:", msg);
      },
    } as AttachAudioInputOptions;

    const opts = deviceId ? ({ ...baseOptions, deviceId } as AttachAudioInputOptions) : baseOptions;
    return attachAudioInputHelper(opts);
  }

  function testSelectedDeviceLive(): Promise<boolean> {
    return testDevice(selectedDeviceId, setAudioInputDevices, (msg?: string) => {
      setErrorMessage(msg);
    });
  }

  function doAttachSystemAudio(): Promise<boolean> {
    return attachSystemAudioHelper({
      audioRef,
      audioContextRef,
      analyserRef,
      sourceNodeRef,
      // no explicit systemStreamRef used in this component; helper supports optional param
      monitoring,
      setSystemCapturing: setIsCapturingSystem,
      // map helper onError to local setErrorMessage
      recordError: (msg?: string) => {
        setErrorMessage(msg);
      },
      debug: clientDebug,
    });
  }

  function doStopSystemAudio(): void {
    stopSystemAudioHelper({
      audioRef,
      sourceNodeRef,
      setSystemCapturing: setIsCapturingSystem,
      recordError: (msg?: string) => {
        setErrorMessage(msg);
      },
      debug: clientDebug,
    });
  }

  // Initialize visualizer when canvas is ready
  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      // Toggle audio element mute based on the monitoring state.
      // When monitoring is enabled, try to play so the user can hear the captured audio.
      try {
        el.muted = !monitoring;
        if (monitoring) {
          try {
            void el.play();
          } catch (error) {
            void error;
          }
        }
      } catch (error) {
        void error;
      }
    }
  }, [monitoring]);
  // Extracted visualizer setup to reusable hook
  useButterchurnVisualizer({
    canvasRef,
    audioContextRef,
    analyserRef,
    visualizerRef,
    presets,
    selectedPreset,
    setErrorMessage: (msg?: string) => { setErrorMessage(msg); },
  });

  useEffect(() => {
    // load preset when selected changes
    if (visualizerRef.current) {
      // proceed
    } else {
      return;
    }
    const preset = presets.find(
      (presetObj) => presetObj.name === selectedPreset,
    )?.preset;
    if (preset) {
      const viz = visualizerRef.current as unknown as
        | { loadPreset?: (presetVal: unknown) => void }
        | undefined;
      if (viz && typeof viz.loadPreset === "function") {
        try {
          viz.loadPreset(preset);
        } catch (error) {
          console.warn(error);
        }
      }
    }
  }, [presets, selectedPreset]);

  return (
    <ButterchurnLiveVisualizerUi
      presets={presets}
      selectedPreset={selectedPreset}
      setSelectedPreset={(val?: string) => { setSelectedPreset(val); }}
      monitoring={monitoring}
      setMonitoring={setMonitoring}
      audioInputDevices={audioInputDevices}
      selectedDeviceId={selectedDeviceId}
      setSelectedDeviceId={(id?: string) => { setSelectedDeviceId(id); }}
      doAttachMic={doAttachMic}
      testSelectedDevice={testSelectedDeviceLive}
      isCapturingSystem={isCapturingSystem}
      doAttachSystemAudio={doAttachSystemAudio}
      doStopSystemAudio={doStopSystemAudio}
      errorMessage={errorMessage}
      canvasRef={canvasRef as unknown as Ref<HTMLCanvasElement>}
      audioRef={audioRef as unknown as Ref<HTMLAudioElement>}
    />
  );
}
