import isValidVisualizer from "./visualizerValidation";

// Minimal shim to adapt problematic upstream exports into a consistent shape
// that exposes a `createVisualizer` factory. Exported as default since this
// module provides a single primary utility.
function adaptButterchurnCandidate(candidateRaw: unknown): unknown {
  let candidate = candidateRaw;
  try {
    // unwrap default if present
    if (candidate && typeof candidate === "object") {
      const maybeDef = (candidate as unknown as { default?: unknown }).default;
      if (maybeDef !== undefined) {
        candidate = maybeDef;
      }
    }
  } catch {
    // ignore
  }

  // If candidate is a function (factory or constructor), return an object
  // with a createVisualizer wrapper that will attempt multiple strategies.
  if (typeof candidate === "function") {
    const fn = candidate as unknown;

    const wrapper = {
      createVisualizer: (
        canvas: HTMLCanvasElement,
        audioContext: AudioContext,
        opts: unknown,
      ): unknown => {
        // Try factory call first
        try {
          const inst = (fn as unknown as (...args: unknown[]) => unknown)(
            audioContext,
            canvas,
            opts,
          );
          if (isValidVisualizer(inst)) {
            return inst;
          }
          if (inst && typeof inst === "object") {
            const proto = (fn as unknown as { prototype?: Record<string, unknown> }).prototype || {};
            attachProtoMethods(inst, proto as Record<string, unknown>);
            if (isValidVisualizer(inst)) {
              return inst;
            }
          }
        } catch {
          // ignore and try constructors
        }

        // Try several constructor signatures
        const Ctor = fn as unknown as { new (...args: unknown[]): unknown };
        const ctorTries: (() => unknown)[] = [
          () => new Ctor(audioContext, canvas, opts),
          () => new Ctor(canvas, audioContext, opts),
          () => new Ctor(canvas, opts),
          () => new Ctor(canvas),
          () => new Ctor(),
        ];

        for (const tryFn of ctorTries) {
          try {
            const inst = tryFn();
            if (inst && typeof inst === "object") {
              safeTryConnectAudio(inst, audioContext);
              const proto = (fn as unknown as { prototype?: Record<string, unknown> }).prototype || {};
              attachProtoMethods(inst, proto as Record<string, unknown>);
              if (isValidVisualizer(inst)) {
                return inst;
              }
            }
          } catch {
            // ignore signature failure
          }
        }

        return undefined;
      },
    } as unknown;

    return wrapper;
  }


  if (candidate && typeof candidate === "object") {
    const hasCreate = (candidate as unknown as { createVisualizer?: unknown }).createVisualizer;
    if (typeof hasCreate === "function") {
      return candidate;
    }
  }

  return candidateRaw;
}

function safeTryConnectAudio(inst: unknown, audioContext: AudioContext): void {
  try {
    if (inst && typeof (inst as unknown as { connectAudio?: unknown }).connectAudio === "function") {
      try {
        (inst as unknown as { connectAudio: (ac: AudioContext) => unknown }).connectAudio(audioContext);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

function attachProtoMethods(inst: unknown, proto: Record<string, unknown>): void {
  if (!inst || typeof inst !== "object") {
    return;
  }
  try {
    const methods = ["render", "connectAudio", "loadPreset", "setRendererSize", "destroy"];
    const instObj = inst as Record<string, unknown>;
    for (const methodName of methods) {
      const protoMethod = proto[methodName];
      if (typeof instObj[methodName] !== "function" && typeof protoMethod === "function") {
        try {
          const fn = protoMethod as (...args: unknown[]) => unknown;
          instObj[methodName] = fn.bind(instObj);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

export default adaptButterchurnCandidate;
