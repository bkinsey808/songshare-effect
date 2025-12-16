/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/strict-boolean-expressions */
import { useEffect, useRef, useState, useCallback, type ReactElement } from "react";
/*
 * Static import to avoid dev-time transform errors from handling dynamic
 * import() expressions in the react-compiler plugin.
 */
import butterchurnModule from "butterchurn";
import presetsModuleDefault from "butterchurn-presets";
import ButterchurnVisualizerUi from "./ButterchurnVisualizerUi";
/* eslint-disable unicorn/prefer-add-event-listener */
import { clientDebug, clientLog } from "@/react/utils/clientLogger";
import { computeCandidateSummary } from "./visualizerHelpers";
import attachAudioInputHelper from "@/react/butterchurn/attachAudioInput";
import type { AttachAudioInputOptions } from "@/react/butterchurn/audioTypes";
import attachSystemAudioHelper from "@/react/butterchurn/attachSystemAudio";
import stopSystemAudioHelper from "@/react/butterchurn/stopSystemAudio";
import { buildNormalizedPresets as buildNormalizedPresetsHelper } from "@/react/butterchurn/presetHelpers";
import useAudioInputDevices from "@/react/butterchurn/useAudioInputDevices";
import testDevice from "@/react/butterchurn/audioDeviceHelpers";
import useButterchurnVisualizer from "@/react/butterchurn/useButterchurnVisualizer";

try {
  const globalContext = globalThis as unknown as {
    __butterchurn_lib?: unknown;
  };
  if (globalContext.__butterchurn_lib === undefined) {
    globalContext.__butterchurn_lib = butterchurnModule;
  }
} catch {
  /* noop: prefer to set global marker early, but ignore errors in constrained environments */
}

type PresetItem = {
  name: string;
  preset: unknown;
};

const NO_EVENTS = 0;

// oxlint-disable max-lines-per-function
export default function ButterchurnVisualizer(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);
  const visualizerRef = useRef<unknown>(undefined);
  const sourceNodeRef = useRef<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | undefined
  >(undefined);
  const systemStreamRef = useRef<MediaStream | undefined>(undefined);

  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | undefined>(undefined);

  function recordError(message: string | undefined): void {
    // Persist last error on the global object and print a lightweight log for E2E tools.
    // Also keep a timeline of debug events (message + timestamp) for easier diagnosis
    // from E2E tests / debug tooling.
    clientLog("ButterchurnVisualizer: setError:", message);

    // Record error history and last-known message on the global object so tests
    // and CI can inspect what happened and when.
    const globalContext = globalThis as unknown as {
      __butterchurn_error_events?: {
        message?: string | undefined;
        ts?: number;
      }[];
      __butterchurn_last_error?: string | undefined;
    }
    if (globalContext.__butterchurn_error_events === undefined) {
      globalContext.__butterchurn_error_events = [];
    }
    globalContext.__butterchurn_error_events.push({ message, ts: Date.now() });
    globalContext.__butterchurn_last_error = message;

    // Log a concise confirmation of the push for runtime traceability.
    {
      const LAST_EVENT_INDEX = -1;
      const events = globalContext.__butterchurn_error_events;
      const lastEvent =
        events && events.length > NO_EVENTS
          ? events.at(LAST_EVENT_INDEX)
          : undefined;
      clientLog("ButterchurnVisualizer: pushed event:", lastEvent);
    }

    setError(message);
  }

  const [systemCapturing, setSystemCapturing] = useState<boolean>(false);
  const [monitoring, setMonitoring] = useState<boolean>(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );

  const { audioInputDevices, setAudioInputDevices } = useAudioInputDevices(selectedDeviceId, (id?: string) => {
    try {
      setSelectedDeviceId(id);
    } catch {
      // ignore
    }
  });

  useEffect(() => {
    // Toggle the audio element monitoring (muted/unmuted)
    const el = audioRef.current;
    if (!el) {
      return;
    }
    el.muted = !monitoring;
  }, [monitoring]);

  // Dynamically load butterchurn / presets when component mounts
  useEffect(() => {
    let cancelled = false;

    function loadPresets(): void {
      // Use the statically imported modules instead of dynamic import
      // expressions so the dev build doesn't show a blocking overlay.
      const presetsModule = presetsModuleDefault;

      if (cancelled) {
        return;
      }

      // Centralize normalization using helper function (stable, testable).
      clientDebug("ButterchurnVisualizer: raw presets module:", presetsModule);
      const {
        normalized,
        firstName,
        libNormalized,
      } = buildNormalizedPresetsHelper(presetsModule, butterchurnModule) as {
        normalized: PresetItem[];
        firstName: string | undefined;
        libNormalized: unknown;
      };

      setPresets(normalized);
      setSelectedPreset(firstName);

      // Keep the try block minimal — only assign to the global and update state.
      try {
        const globalContext = globalThis as unknown as {
          __butterchurn_lib?: unknown;
        };
        if (libNormalized !== undefined) {
          globalContext.__butterchurn_lib = libNormalized;
        }

        clientDebug(
          "__butterchurn_lib normalized and set (loadPresets):",
          libNormalized,
        );
        // Prefer a `warn` level log that is allowed by lint and include a concise candidate summary for diagnostics
        console.warn("ButterchurnVisualizer: __butterchurn_lib set", computeCandidateSummary(libNormalized));
        // Clear any previous error state now that the library was loaded successfully
        recordError(undefined);
      } catch (error) {
        clientDebug(
          "ButterchurnVisualizer: setting error: 'Unable to load butterchurn or presets. Try running `npm install` to add dependencies.' (loadPresets failed)",
          error,
        );
        recordError(
          "Unable to load butterchurn or presets. Try running `npm install` to add dependencies.",
        );
      }
    }

    loadPresets();

    return (): void => {
      cancelled = true;
    };
  }, []);

  function testSelectedDevice(): Promise<boolean> {
    return testDevice(selectedDeviceId, setAudioInputDevices, recordError);
  }

  function attachSystemAudio(): Promise<boolean> {
    return attachSystemAudioHelper({
      audioRef,
      audioContextRef,
      analyserRef,
      sourceNodeRef,
      systemStreamRef,
      monitoring,
      setSystemCapturing,
      recordError,
      debug: clientDebug,
    });
  }

  function stopSystemAudio(): void {
    stopSystemAudioHelper({
      audioRef,
      sourceNodeRef,
      systemStreamRef,
      setSystemCapturing,
      recordError,
      debug: clientDebug,
    });
  }

  const [isMicActive, setIsMicActive] = useState<boolean>(false);

  const attachAudioInput = useCallback(async (): Promise<boolean> => {
    const baseOptions = {
      audioContextRef,
      analyserRef,
      sourceNodeRef,
      recordError,
      debug: clientDebug,
    } as const;

    const opts = selectedDeviceId
      ? ({ ...baseOptions, deviceId: selectedDeviceId } as AttachAudioInputOptions)
      : (baseOptions as AttachAudioInputOptions);

    // Use the shared helper which handles permission, device selection and errors
    try {
      const success = await attachAudioInputHelper(opts);
      if (success) {
        setIsMicActive(true);
      }
      return success;
    } catch (error) {
      clientDebug("attachAudioInput helper threw:", error);
      recordError?.("Audio input access failed or was denied.");
      return false;
    }
  }, [selectedDeviceId, audioContextRef, analyserRef, sourceNodeRef]);

  // Auto-switch device if mic is already active
  useEffect(() => {
    if (isMicActive && selectedDeviceId) {
      void attachAudioInput();
    }
  }, [selectedDeviceId, isMicActive, attachAudioInput]);

  // Use the hook to manage the visualizer lifecycle
  useButterchurnVisualizer({
    canvasRef,
    audioContextRef,
    analyserRef,
    visualizerRef,
    presets,
    selectedPreset,
    setErrorMessage: recordError,
  });

  // Load preset when changed (handled by hook, but hook only loads on mount/change if visualizer exists)
  // The hook handles `selectedPreset` changes.

  return (
    <ButterchurnVisualizerUi
      containerRef={containerRef}
      canvasRef={canvasRef}
      audioRef={audioRef}
      analyserRef={analyserRef}
      presets={presets}
      selectedPreset={selectedPreset}
      setSelectedPreset={setSelectedPreset}
      monitoring={monitoring}
      setMonitoring={setMonitoring}
      attachAudioInput={attachAudioInput}
      testDevice={testSelectedDevice}
      audioDevices={audioInputDevices}
      selectedDeviceId={selectedDeviceId}
      setSelectedDeviceId={setSelectedDeviceId}
      systemCapturing={systemCapturing}
      stopSystemAudio={stopSystemAudio}
      attachSystemAudio={attachSystemAudio}
      error={error}
    />
  );
}

