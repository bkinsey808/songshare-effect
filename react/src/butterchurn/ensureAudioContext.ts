/**
 * ensureAudioContext.ts
 *
 * Small helper to create/return a shared AudioContext instance and optionally
 * create/attach an AnalyserNode.
 *
 * The module purpose is to provide a single, well-typed function per file
 * (single export) to comply with the project's style preferences.
 */

import type { EnsureAudioContextOpts } from "./audioTypes";

/**
 * Create or return a previously created AudioContext; optionally create an analyser node.
 *
 * Throws when no platform AudioContext constructor is available.
 */
export default function ensureAudioContext({
  audioContextRef,
  analyserRef,
}: EnsureAudioContextOpts): AudioContext {
  if (audioContextRef.current) {
    return audioContextRef.current;
  }

  const gw: unknown = globalThis;
  /* Narrowing global platform constructors requires a small amount of
   * unsafe assertion because the type of `globalThis` is environment
   * dependent (DOM vs. node). Keep this localized and intentional. */
  /* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
  let Ctor: typeof AudioContext | undefined = undefined;
  if (typeof (gw as { AudioContext?: unknown }).AudioContext === "function") {
    Ctor = (gw as { AudioContext: unknown }).AudioContext as typeof AudioContext;
  } else if (typeof (gw as { webkitAudioContext?: unknown }).webkitAudioContext === "function") {
    Ctor = (gw as { webkitAudioContext: unknown }).webkitAudioContext as typeof AudioContext;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
  if (!Ctor) {
    throw new Error("AudioContext unavailable");
  }

  const audioContext = new Ctor();
  audioContextRef.current = audioContext;
  
  // Some headless or constrained environments (e.g., Playwright / JS DOM
  // variants) may provide an AudioContext that lacks less-common helper
  // factory methods like `createDelay`. Butterchurn presets sometimes call
  // `context.createDelay()` and that will throw if missing; add a very small
  // safe shim so tests and constrained runtimes don't encounter an
  // "createDelay is not a function" TypeError. The shim attempts to return
  // a minimal object compatible with common usage (connect + delayTime).
  /* The following block does runtime shimming of nonstandard WebAudio helpers
   * and relies on narrowing checks against global platform objects. These
   * narrow assertions are intentional and safe in this low-level helper. */
  /* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any */
  try {
    if (typeof (audioContext as unknown as { createDelay?: unknown }).createDelay !== "function") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      (audioContext as unknown as { createDelay?: unknown }).createDelay = function createDelayShim(
        _maxDelay?: number,
      ): DelayNode {
        // Try to create a GainNode to act as a pass-through if available
        // so connect/disconnect behave reasonably.
        let passthrough: GainNode | undefined = undefined;
        try {
          const acWithGain = audioContext as unknown as {
            createGain?: () => GainNode;
          };
          if (typeof acWithGain.createGain === "function") {
            passthrough = acWithGain.createGain();
          }
        } catch {
          // ignore
        }

        const node = {
          delayTime: {
            value: 0,
            // no-op setter for environments that don't support AudioParam
            setValueAtTime: (_v: number, _t: number) => undefined,
          },
          connect: (dest: unknown) => {
            try {
              if (passthrough) {
                // The WebAudio connect signature accepts either an `AudioNode`
                // or an `AudioParam`. Use a best-effort runtime check and
                // call the appropriate overload to satisfy TypeScript.
                if (dest !== null && typeof dest === "object" && "defaultValue" in dest) {
                  // prefer to call the AudioParam overload when it looks like an AudioParam
                  passthrough.connect(dest as unknown as AudioParam);
                } else {
                  // Best-effort: accept any destination and let the native API
                  // throw if the destination is invalid.
                  // Call via a widened signature to avoid unsafe typed arguments
                  (passthrough.connect as unknown as (destArg: unknown) => void)(dest);
                }
              }
            } catch {
              // ignore
            }
            return dest;
          },
          disconnect: () => {
            try {
              if (passthrough && typeof passthrough.disconnect === "function") {
                passthrough.disconnect();
              }
            } catch {
              // ignore
            }
          },
        } as unknown as DelayNode;
        return node;
      };
    }
  } catch {
    // Best-effort shim – don't let failure to shim block audio context creation.
  }
  /* eslint-enable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-explicit-any */

  if (analyserRef) {
    try {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      if (analyserRef !== undefined) {
        analyserRef.current = analyser;
      }
    } catch {
      // Best-effort: analyzers may fail on some platforms — don't throw.
    }
  }

  return audioContext;
}
