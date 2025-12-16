import { useEffect, useRef, useState, type RefObject } from "react";
import { createVisualizerSafely } from "./visualizerHelpers";
import ensureAudioContextHelper from "./ensureAudioContext";
import createVisualizerFromPort from "./portAdapter";
import adaptButterchurnCandidate from "./compatShim";
const DEFAULT_PIXEL_RATIO = 1;

function hasRender(obj: unknown): obj is { render: () => void } {
  return typeof obj === "object" && obj !== null && typeof (obj as { render?: unknown }).render === "function";
}

function hasDestroy(obj: unknown): obj is { destroy: () => void } {
  return typeof obj === "object" && obj !== null && typeof (obj as { destroy?: unknown }).destroy === "function";
}

function hasCreateVisualizer(obj: unknown): obj is { createVisualizer: unknown } {
  return typeof obj === "object" && obj !== null && typeof (obj as { createVisualizer?: unknown }).createVisualizer === "function";
}

// Removed duplicate import of RefObject

type UseOpts = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  audioContextRef: RefObject<AudioContext | undefined>;
  analyserRef: RefObject<AnalyserNode | undefined>;
  visualizerRef: RefObject<unknown>;
  presets: { name: string; preset: unknown }[];
  selectedPreset: string | undefined;
  setErrorMessage: (msg?: string) => void;
};

export default function useButterchurnVisualizer({
  canvasRef,
  audioContextRef,
  analyserRef,
  visualizerRef,
  presets,
  selectedPreset,
  setErrorMessage,
}: UseOpts): void {
  // Use a ref to access the latest selectedPreset inside the effect without triggering re-creation
  const selectedPresetRef = useRef(selectedPreset);
  useEffect(() => {
    selectedPresetRef.current = selectedPreset;
  }, [selectedPreset]);

  // Trigger to request a re-setup when an external event (e.g., analyser change)
  // occurs. The event listener increments `rebuildTrigger` which we include in
  // the setup effect dependency list so the visualizer is torn down and
  // recreated (picking up updated analyserRefs) without accessing ref values
  // during render.
  const INITIAL_REBUILD_TRIGGER = 0;
  const REBUILD_INCREMENT = 1;
  const [rebuildTrigger, setRebuildTrigger] = useState<number>(INITIAL_REBUILD_TRIGGER);

  useEffect((): (() => void) => {
    function handleRebuild(): void {
      setRebuildTrigger((prev: number) => prev + REBUILD_INCREMENT);
    }
    try {
      globalThis.addEventListener("butterchurn:analyser-changed", handleRebuild as EventListener);
    } catch {
      // noop
    }
    return (): void => {
      try {
        globalThis.removeEventListener("butterchurn:analyser-changed", handleRebuild as EventListener);
      } catch {
        // noop
      }
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    let cancelled = false;

    let renderActiveSet = false;
    function frameLoop(): void {
      if (cancelled) {
        return;
      }
      try {
        const viz = visualizerRef.current;
        if (hasRender(viz)) {
          viz.render();
          if (!renderActiveSet) {
            renderActiveSet = true;
            try {
              (globalThis as unknown as { __butterchurn_render_active?: boolean }).__butterchurn_render_active = true;
            } catch {
              // ignore write failures in strict environments
            }
          }
        }
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error("ButterchurnVisualizer: render error:", error);
      }

      rafId = requestAnimationFrame(frameLoop);
    }

    function setup(): void {
      const globalContext = globalThis as typeof globalThis & { __butterchurn_lib?: unknown; butterchurn?: unknown };
      // Prefer an explicit lib set on globalThis but fall back to the UMD global (window.butterchurn) when present
      let libCandidate = globalContext.__butterchurn_lib ?? (globalContext as unknown as { butterchurn?: unknown }).butterchurn;
      if (!libCandidate && (globalContext as unknown as { butterchurn?: unknown }).butterchurn) {
        libCandidate = (globalContext as unknown as { butterchurn?: unknown }).butterchurn;
        // Mirror into the canonical slot for diagnostics / consistency
        try {
          globalContext.__butterchurn_lib = libCandidate;
        } catch {
          // ignore if global isn't writable in this environment
        }
      }

      // Try to adapt known problematic upstream shapes before attempting instantiation.
      try {
        libCandidate = adaptButterchurnCandidate(libCandidate);
      } catch {
        // ignore shim failures
      }

      if (!hasCreateVisualizer(libCandidate)) {
        setErrorMessage("butterchurn library not initialized");
        return;
      }

      let ctx: AudioContext | undefined = undefined;
      try {
        ctx = ensureAudioContextHelper({ audioContextRef, analyserRef });
      } catch (error) {
        console.warn(error);
        setErrorMessage("AudioContext creation failed");
        return;
      }

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
      }

      const canvasEl = canvasRef.current ?? document.createElement("canvas");
      // Initial size from container or defaults
      const DEFAULT_WIDTH = 800;
      const DEFAULT_HEIGHT = 600;
      const width = canvasEl.clientWidth || DEFAULT_WIDTH;
      const height = canvasEl.clientHeight || DEFAULT_HEIGHT;
      const pixelRatio = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? DEFAULT_PIXEL_RATIO;

      // Set canvas buffer size to match display size * pixel ratio
      canvasEl.width = width * pixelRatio;
      canvasEl.height = height * pixelRatio;

      let instance = createVisualizerSafely(libCandidate, {
        canvasElement: canvasEl,
        audioContext: ctx,
        analyserNode: analyserRef.current ?? ctx.createAnalyser(),
        width,
        height,
        pixelRatio,
        recordError: (msg?: string) => {
          setErrorMessage(msg);
        },
      });

      // If library instantiation failed, fall back to the local ported MVP visualizer
      if ((instance === undefined || instance === null)) {
        try {
          const createFromPort = createVisualizerFromPort as unknown as ((opts: { canvasElement: HTMLCanvasElement; audioContext?: AudioContext | undefined; analyserNode?: AnalyserNode | undefined; width?: number; height?: number; pixelRatio?: number; }) => unknown);
          if (typeof createFromPort === "function") {
            instance = createFromPort({ canvasElement: canvasEl, audioContext: ctx, analyserNode: analyserRef.current, width, height, pixelRatio });
            console.warn("ButterchurnVisualizer: using ported visualizer fallback");
          }
        } catch (error) {
          console.warn("ButterchurnVisualizer: ported fallback failed:", error);
        }
      }

      if (instance !== undefined && instance !== null) {
        visualizerRef.current = instance;
        console.warn("ButterchurnVisualizer: hasRender:", hasRender(instance));
        console.warn("ButterchurnVisualizer: render type:", typeof (instance as unknown as { render?: unknown }).render);
        try {
          const ownProps = Object.getOwnPropertyNames(instance as object);
          console.warn("ButterchurnVisualizer: instance own property names:", ownProps);
          const proto = Object.getPrototypeOf(instance as object);
          let protoKeys: string[] | undefined = undefined;
          if (proto) {
            protoKeys = Object.getOwnPropertyNames(proto);
          }
          console.warn("ButterchurnVisualizer: instance prototype keys:", protoKeys);
          console.warn("ButterchurnVisualizer: connectAudio type:", typeof (instance as unknown as { connectAudio?: unknown }).connectAudio);
        } catch {
          // ignore diagnostic failures
        }
        
        // Setup resize observer to keep canvas buffer size in sync with display size
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === canvasEl) {
              const newWidth = entry.contentRect.width;
              const newHeight = entry.contentRect.height;
              
              // Update canvas buffer dimensions
              canvasEl.width = newWidth * pixelRatio;
              canvasEl.height = newHeight * pixelRatio;

              // Tell butterchurn to resize
              if (hasRender(instance) && "setRendererSize" in instance && typeof (instance as { setRendererSize: unknown }).setRendererSize === "function") {
                 (instance as { setRendererSize: (width: number, height: number) => void }).setRendererSize(newWidth, newHeight);
              }
            }
          }
        });
        observer.observe(canvasEl);
        
        // Store observer cleanup on the visualizer instance or closure if possible, 
        // but since we don't have a clean place on the instance, we'll handle it in the effect cleanup.
        // Actually, we can just attach it to the instance if we want, or better, return it from setup.
        // For now, let's just keep it simple and rely on the fact that we tear down everything on unmount.
        // Wait, we need to disconnect it.
        (instance as { _observer?: ResizeObserver })._observer = observer;

      // Load the initial preset if available
      if (selectedPresetRef.current) {
        const presetItem = presets.find((item) => item.name === selectedPresetRef.current);
        console.warn("ButterchurnVisualizer: selectedPreset:", selectedPresetRef.current, "Found item:", !!presetItem);
        console.warn("ButterchurnVisualizer: instance keys:", Object.keys(instance as object));
        
        if (presetItem && "loadPreset" in (instance as object)) {
            try {
              console.warn("ButterchurnVisualizer: loading initial preset:", selectedPresetRef.current);
              const IMMEDIATE_BLEND = 0;
              (instance as { loadPreset: (preset: unknown, time: number) => void }).loadPreset(presetItem.preset, IMMEDIATE_BLEND);
            } catch (error) {
              console.error("ButterchurnVisualizer: failed to load initial preset:", error);
            }
        } else {
            console.warn("ButterchurnVisualizer: preset not found or loadPreset missing", selectedPresetRef.current);
        }
      } else {
          console.warn("ButterchurnVisualizer: no selected preset initially");
      }

      frameLoop();
    }
  }

  setup();

  return (): void => {
    cancelled = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    const viz = visualizerRef.current;
    // Cleanup resize observer (outside try/catch for React Compiler)
    if (viz && (viz as { _observer?: ResizeObserver })._observer) {
      (viz as { _observer?: ResizeObserver })._observer?.disconnect();
    }

    try {
      if (hasDestroy(viz)) {
        viz.destroy();
      }
    } catch {
      // ignore
    }
    visualizerRef.current = undefined;
    try {
      // clear the debug rendering flag if present
      const globalObj = globalThis as unknown as { __butterchurn_render_active?: boolean };
      if (globalObj.__butterchurn_render_active) {
        try {
          delete globalObj.__butterchurn_render_active;
        } catch {
          globalObj.__butterchurn_render_active = false;
        }
      }
    } catch {
      // ignore
    }

    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = undefined;
    }
  };
}, [canvasRef, audioContextRef, analyserRef, visualizerRef, presets, setErrorMessage, rebuildTrigger]);

  // Separate effect to handle preset changes without recreating the visualizer
  useEffect(() => {
    const viz = visualizerRef.current;
    if (!viz || !selectedPreset) {
      return;
    }

    const presetItem = presets.find((item) => item.name === selectedPreset);
    if (presetItem && "loadPreset" in (viz as object)) {
      try {
        const BLEND_TIME = 2.7;
        (viz as { loadPreset: (preset: unknown, time: number) => void }).loadPreset(presetItem.preset, BLEND_TIME);
      } catch (error) {
        console.error("ButterchurnVisualizer: failed to load preset:", error);
      }
    }
  }, [selectedPreset, presets, visualizerRef]);
}
