/* eslint-disable max-depth, new-cap, @typescript-eslint/no-explicit-any */
// This module runs in the browser as a Vite-served ESM module. Because Vite
// rewrites imports in served module code, attempting `import('butterchurn')`
// here will be resolved by the dev server during dev. We expose the results
// to `globalThis.__butterchurn_import_debug` for E2E inspection.

async function inspectImport(spec: string) {
  const out: any = { spec };
  try {
    const mod = await import(spec as any);
    const modObj = (mod as unknown as Record<string, unknown>) ?? {};
    out.moduleKeys = Object.keys(modObj);
    const exported = mod && (mod as any).default ? (mod as any).default : mod;
    out.exportedType = typeof exported;
    out.hasCreateVisualizer = typeof exported?.createVisualizer === 'function';
    out.isFunction = typeof exported === 'function';

    // Try to construct without audio (best-effort) just to inspect shape
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120; canvas.height = 90;
      document.body.append(canvas);
      let inst: unknown = undefined; // will be inspected dynamically
      if (out.hasCreateVisualizer) {
        try {
          inst = (exported as unknown as { createVisualizer?: (...args: unknown[]) => unknown }).createVisualizer?.(undefined, canvas, {});
        } catch (error) {
          out.createError = String(error);
        }
      } else if (out.isFunction) {
        try {
          inst = (exported as unknown as ((...args: unknown[]) => unknown))(undefined, canvas, {});
        } catch (error) {
          out.callError = String(error);
        }
        if (!inst) {
          try {
            inst = new (exported as unknown as { new(...args: unknown[]): unknown })(undefined, canvas, {});
          } catch (error) {
            out.ctorError = String(error);
          }
        }
      }

      if (inst) {
        out.instanceOwnKeys = Object.getOwnPropertyNames(inst);
        out.instanceProtoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(inst) || {});
        out.instanceHasRender = typeof (inst as unknown as { render?: unknown }).render === 'function';
        out.instanceHasConnectAudio = typeof (inst as unknown as { connectAudio?: unknown }).connectAudio === 'function';
        try {
          if (typeof (inst as any).destroy === 'function') {
            (inst as any).destroy();
          }
        } catch {
          // ignore destroy failures (best-effort cleanup)
        }
      }
    } catch (error) {
      out.instantiateError = String(error);
    }

    return out;
  } catch (error) {
    return { spec, importError: String(error) };
  }
}


try {
  await (async function run(): Promise<void> {
    const specs = [
      'butterchurn',
      '/node_modules/butterchurn/lib/butterchurn.js',
      '/vendor/butterchurn.js',
    ];
    const results: unknown[] = [];
    for (const specName of specs) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await inspectImport(specName));
    }
    Reflect.set(globalThis, '__butterchurn_import_debug', results);
  })();
} catch (error: unknown) {
  // eslint-disable-next-line no-console
  console.error('import-debug run failed:', error);
}

// Mark module boundary so bundlers/linters treat this as a module
const __import_debug_marker = true;
export default __import_debug_marker;
