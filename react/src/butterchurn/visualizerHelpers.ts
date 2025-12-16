/* Visualizer helpers for butterchurn visualizers.
 *
 * This module provides a small, well-typed helper that attempts to invoke
 * a butterchurn `createVisualizer` export while accepting several different
 * runtime shapes (factory function, class constructor, nested `.default`).
 *
 * The helper takes a small opts object containing a `canvasElement`, audio
 * artifacts and dimensions, and returns either the visualizer instance
 * or undefined if instantiation fails (while recording the error via the
 * provided `recordError` function).
 *
 * This file focuses only on visualizer instantiation and normalization so it
 * can be authored and tested independently of audio helpers.
 */
/* eslint-disable import/exports-last */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { clientDebug } from "@/react/utils/clientLogger";
import stringifyUnknown from "@/react/utils/stringifyUnknown";
import isValidVisualizer from "./visualizerValidation";
import tryFactoryCall from "./compatHelpers";
import { computeCandidateSummary, computeMaybeSummary } from "./visualizerSummaries";
/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
function noopError(_unusedMessage?: string): void {
  // No-op implementation that matches the RecordErrorFn signature.
  return;
}
function noopDebug(..._unusedArgs: unknown[]): void {
  // No-op debug implementation
  return;
}


/**
 * Validate a created visualizer instance exposes at least one of the
 * expected surface methods or properties. Kept as a top-level helper to
 * avoid recreating it on every `createVisualizerSafely` invocation.
 */

export type RecordErrorFn = (message?: string) => void;

/**
 * Minimal options for creating a visualizer instance.
 */
export type CreateVisualizerOptions = {
  canvasElement: HTMLCanvasElement;
  audioContext: AudioContext;
  analyserNode: AnalyserNode;
  width: number;
  height: number;
  pixelRatio?: number;
};

/**
 * Helper options; the caller may pass either an explicit `recordError`
 * callback or provide it as the third param to createVisualizerSafely.
 */
export type CreateVisualizerSafelyOpts = CreateVisualizerOptions & {
  recordError?: RecordErrorFn;
  debug?: (...args: unknown[]) => void;
};


/**
 * createVisualizerSafely:
 * - Accepts raw lib candidate and a typed options object (plus optional recordError).
 * - Tries to normalize and invoke the library's exported visualizer:
 *   - If the candidate is an object with `createVisualizer`, prefer that.
 *   - If the candidate is a function, attempt to call it as a factory.
 *   - If calling as a function fails, attempt `new` to handle constructor forms.
 *
 * The function always returns the created instance or `undefined` and calls
 * `recordError` with a short user-facing message in case of failure.
 */
export function createVisualizerSafely(
  libCandidate: unknown,
  opts: CreateVisualizerSafelyOpts,
  maybeRecordError?: RecordErrorFn,
): unknown {
  const {
    canvasElement,
    audioContext,
    analyserNode,
    width,
    height,
    pixelRatio,
    recordError: recordErrorFromOpts,
    debug,
  } = opts;

  // Prefer explicit recordError argument if provided
  const recordError = maybeRecordError ?? recordErrorFromOpts ?? noopError;
  const debugFn = debug ?? clientDebug ?? noopDebug;

  // Minimal runtime validation
  if (canvasElement === undefined) {
    recordError("Canvas element missing for visualizer creation.");
    return undefined;
  }
  if (audioContext === undefined) {
    recordError("AudioContext missing for visualizer creation.");
    return undefined;
  }
  if (analyserNode === undefined) {
    recordError("Analyser node missing for visualizer creation.");
    return undefined;
  }

  // Prefer a nested `.createVisualizer` if present on the candidate.
  let candidate: unknown = libCandidate;
  if (candidate !== null && typeof candidate === "object") {
    const maybeCreate = (candidate as { createVisualizer?: unknown })
      .createVisualizer;
    if (maybeCreate !== undefined && maybeCreate !== null) {
      candidate = maybeCreate;
    } else {
      // If the current object doesn't expose `createVisualizer` but exposes a nested default, prefer it.
      try {
        const nestDefault = (candidate as { default?: unknown }).default;
        if (nestDefault !== undefined && nestDefault !== null) {
          candidate = nestDefault;
        }
      } catch {
        // ignore; we'll try other strategies below
      }
    }
  }

  // Candidate must now be a function or a class constructor. Prefer calling as a factory
  // first, then try using `new` as a fallback.
  if (typeof candidate !== "function") {
    recordError("butterchurn createVisualizer not found or invalid.");
    return undefined;
  }

  // Log candidate summary for diagnostics
  try {
    debugFn("createVisualizerSafely: candidate summary:", computeCandidateSummary(candidate));
  } catch {
    // ignore diagnostics failures
  }

  // Candidate is a function. Use heuristics to determine whether it's a class constructor
  // (which should be invoked with `new`) or a factory function (invoked directly).
  const fn = candidate as unknown as (...args: unknown[]) => unknown;
  let fnStr = "";
  try {
    fnStr = Function.prototype.toString.call(fn);
  } catch {
    fnStr = "";
  }

  // Check prototype keys to detect transpiled class-like shapes
  const proto = (fn as unknown as { prototype?: Record<string, unknown> }).prototype;
  const protoKeys = proto ? Object.getOwnPropertyNames(proto) : [];
  const hasProtoMembers = protoKeys.length > NO_KEYS;

  const looksLikeClass = /^\s*class\b/.test(fnStr) || fnStr.includes("_classCallCheck") || hasProtoMembers;

  function logInstanceSummary(instance: unknown): void {
    try {
      debugFn("createVisualizerSafely: instance summary:", computeMaybeSummary(instance));
    } catch {
      // ignore
    }
  }

  // Try invoking candidate as a factory using the compat helper and return a
  // valid visualizer instance or undefined. Factored out to reduce nesting
  // depth inside the main class-like fallback handling.
  function tryFactoryFallback(): unknown {
    const args: { candidate: unknown; audioContext: AudioContext; canvas: HTMLCanvasElement; width: number; height: number; pixelRatio?: number } = { candidate, audioContext, canvas: canvasElement, width, height };
    if (pixelRatio !== undefined) { args.pixelRatio = pixelRatio; }
    const fallbackCandidate = tryFactoryCall(args);
    if (fallbackCandidate === undefined) {
      return undefined;
    }
    try {
      tryConnectAudio(fallbackCandidate);
    } catch {
      // ignore
    }
    if (isValidVisualizer(fallbackCandidate)) {
      return fallbackCandidate;
    }
    return undefined;
  }


  function tryConnectAudio(instance: unknown): void {
    if (instance && typeof (instance as { connectAudio?: unknown }).connectAudio === "function") {
      (instance as { connectAudio: (node: AnalyserNode) => void }).connectAudio(analyserNode);
    }
  }

  // Helper that tries different constructor signatures and validates the resulting instance
  function attemptConstructors(Ctor: unknown): unknown {
    // Prepare helpful runtime artifacts
    const canvas = canvasElement;
    // Try to get WebGL rendering context (preferred for butterchurn renderer)
    let gl: WebGLRenderingContext | undefined = undefined;
    try {
      gl = (canvas && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))) as WebGLRenderingContext | undefined;
    } catch {
      gl = undefined;
    }

    const audioObj = {
      audioContext: audioContext,
      // let the library create or use analyser if needed; include analyser if available
      analyser: analyserNode,
    } as unknown;

    const CtorTyped = Ctor as unknown as new (...args: unknown[]) => unknown;

    const tries: (() => unknown)[] = [
      // Common: (gl, audioWrapper, opts)
      () => (gl ? new CtorTyped(gl, audioObj, { width, height, pixelRatio }) : (() => { throw new Error('no-gl'); })()),
      // (gl, audioContext, opts)
      () => (gl ? new CtorTyped(gl, audioContext, { width, height, pixelRatio }) : (() => { throw new Error('no-gl'); })()),
      // (gl, canvas, opts)
      () => (gl ? new CtorTyped(gl, canvas, { width, height, pixelRatio }) : (() => { throw new Error('no-gl'); })()),
      // (audioContext, canvas, opts) - older factory style
      () => new CtorTyped(audioContext, canvas, { width, height, pixelRatio }),
      // (canvas, audioContext, opts)
      () => new CtorTyped(canvas, audioContext, { width, height, pixelRatio }),
      // (canvas, opts)
      () => new CtorTyped(canvas, { width, height, pixelRatio }),
      // (canvas) simple
      () => new CtorTyped(canvas),
      // fallback: no args
      () => new CtorTyped(),
    ];

    for (const fn of tries) {
      try {
        const instance = fn();
        tryConnectAudio(instance);
        logInstanceSummary(instance);
        if (isValidVisualizer(instance)) { return instance; }
      } catch (error) {
        debugFn("createVisualizerSafely: constructor signature attempt failed:", String(error));
        // continue trying other signatures
      }
    }
    return undefined;
  }

  if (looksLikeClass) {
    try {
      const Ctor = candidate as unknown as new (ctx: AudioContext, cvs: HTMLCanvasElement, opts: unknown) => unknown;
      const instance = attemptConstructors(Ctor);
      if (!instance) {
        debugFn("createVisualizerSafely: constructor instantiation failed for all tried signatures");
        // Before giving up, attempt a factory-style fallback using a helper to
        // reduce nesting and make the logic easier to follow.
        const factoryFallback = tryFactoryFallback();
        if (factoryFallback !== undefined) {
          debugFn("createVisualizerSafely: class-like candidate succeeded when called as factory fallback");
          return factoryFallback;
        }

        // Include candidate summary and a short function string snippet to aid debugging
        try {
          const summary = computeCandidateSummary(candidate);
          const fnSnippet = (fnStr && typeof fnStr === "string") ? fnStr.slice(FN_SNIPPET_START, FN_SNIPPET_LEN) : "";
          recordError(
            `Failed to instantiate butterchurn visualizer via constructor (no matching signature) - candidate: ${String(
              summary,
            )} fnSnippet: ${fnSnippet}`,
          );
        } catch {
          recordError("Failed to instantiate butterchurn visualizer via constructor (no matching signature)");
        }
        return undefined;
      }
      return instance;
    } catch (error) {
      debugFn("createVisualizerSafely: constructor instantiation failed:", error);
      try {
        const summary = computeCandidateSummary(candidate);
        recordError(`Failed to instantiate butterchurn visualizer: ${stringifyUnknown(error)} - candidate: ${String(summary)}`);
      } catch {
        recordError(`Failed to instantiate butterchurn visualizer: ${stringifyUnknown(error)}`);
      }
      return undefined;
    }
  }

  // Otherwise, try factory call first and only attempt constructor fallback for class-like errors.
  try {
    const createFn = candidate as (ctx: AudioContext, cvs: HTMLCanvasElement, opts: unknown) => unknown;
    const instance = createFn(audioContext, canvasElement, {
      width,
      height,
      pixelRatio,
    });
    tryConnectAudio(instance);
    logInstanceSummary(instance);
    return instance;
  } catch (error) {
    let errMsg = "";
    if (error instanceof Error) {
      errMsg = error.message;
    } else if (typeof error === "string") {
      errMsg = error;
    } else {
      errMsg = String(error);
    }
    // If the factory call failed because the export was actually a class, try `new`.
    if (/Cannot call a class|Class constructor|_classCallCheck/i.test(errMsg) || errMsg.includes('class')) {
      try {
        const Ctor = candidate as unknown as new (ctx: AudioContext, cvs: HTMLCanvasElement, opts: unknown) => unknown;
        const instance = new Ctor(audioContext, canvasElement, {
          width,
          height,
          pixelRatio,
        });
        tryConnectAudio(instance);
        logInstanceSummary(instance);
        return instance;
      } catch (error) {
        debugFn("createVisualizerSafely: constructor fallback failed:", error);
        const msg = stringifyUnknown(error ?? error ?? "Failed to create visualizer");
        recordError(`Failed to instantiate butterchurn visualizer: ${msg}`);
        return undefined;
      }
    }

    // Otherwise, surface a useful error and avoid noisy fallbacks.
    debugFn("createVisualizerSafely: factory call failed and error is not class-like:", error);
    recordError(`Failed to create butterchurn visualizer: ${stringifyUnknown(error ?? "Factory call failed")}`);
    return undefined;
  }
}

const NO_KEYS = 0;
const FN_SNIPPET_START = 0;
const FN_SNIPPET_LEN = 200;

// oxlint-disable-next-line max-lines-per-function
export function normalizeButterchurnCandidate(bcRaw: unknown): unknown {
  // Prefer a top-level `.default` if present, otherwise use raw.
  let candidate = (bcRaw as { default?: unknown })?.default ?? bcRaw;
  let candidateNormalized: unknown = candidate;
  try {
    if (
      candidateNormalized !== null &&
      typeof candidateNormalized === "object"
    ) {
      const candDefault = (candidateNormalized as { default?: unknown })
        .default;
      if (candDefault !== undefined) {
        candidateNormalized = candDefault;
      }
    }
  } catch {
    // noop - fall back to candidateNormalized
  }

  // If the export is a function (common for CommonJS/UMD builds), wrap it so the rest of the code can rely on `createVisualizer`.
  if (typeof candidateNormalized === "function") {
    candidateNormalized = { createVisualizer: candidateNormalized } as unknown;
  } else if (
    candidateNormalized !== null &&
    typeof candidateNormalized === "object"
  ) {
    const hasCreateVisualizer = (
      candidateNormalized as { createVisualizer?: unknown }
    ).createVisualizer;
    if (!hasCreateVisualizer) {
      const candDefault = (candidateNormalized as { default?: unknown })
        .default;
      if (typeof candDefault === "function") {
        candidateNormalized = { createVisualizer: candDefault } as unknown;
      }
    }
  }


  return candidateNormalized;
}

export { computeCandidateSummary, computeMaybeSummary } from "./visualizerSummaries";
