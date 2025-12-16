/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-type-assertion */
import { chromium, type Browser } from "playwright";

const RESPONSE_STATUS_THRESHOLD = 400;
const WAIT_MS = 4000;
const MAX_RESULTS = 30;
const JSON_SPACES = 2;

type BadResponse = { url: string; status: number; statusText?: string };

async function main(): Promise<void> {
  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const badResponses: BadResponse[] = [];
  page.on("response", (res) => {
    try {
      const status = res.status();
      if (status >= RESPONSE_STATUS_THRESHOLD) {
        badResponses.push({ url: res.url(), status, statusText: res.statusText() });
      }
    } catch {
      // ignore inspect failures
    }
  });

  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (message) => {
    try {
      consoleMessages.push({ type: message.type(), text: message.text() });
    } catch {
      // ignore
    }
  });

  // Navigate to the demo page and wait for load
  const baseUrl = typeof process.env['PLAYWRIGHT_BASE_URL'] === 'string' && process.env['PLAYWRIGHT_BASE_URL'] !== '' ? process.env['PLAYWRIGHT_BASE_URL'] : undefined;
  if (typeof baseUrl === 'string' && baseUrl !== '') {
    await page.goto(`${baseUrl}/en/butterchurn-demo`, { waitUntil: 'load' });
  } else {
    await page.goto('https://127.0.0.1:5173/en/butterchurn-demo', { waitUntil: 'load' });
  }

  // Wait briefly to allow async module requests to happen
  await page.waitForTimeout(WAIT_MS);

  // Inspect createVisualizer by calling it in-page with a small test canvas/audio context
  const createInspect = await page.evaluate<unknown>(async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    function inspectInstance(inst: unknown): { instanceType: string; instanceOwnKeys: string[]; instanceProtoKeys?: string[] | undefined; hasRender?: boolean; hasConnectAudio?: boolean } {
      const own = inst !== null && inst !== undefined ? Object.getOwnPropertyNames(inst as object) : [];
      const proto = inst !== null && inst !== undefined ? Object.getPrototypeOf(inst as object) : undefined;
      const protoKeys = proto ? Object.getOwnPropertyNames(proto) : undefined;
      return {
        instanceType: typeof inst,
        instanceOwnKeys: own,
        instanceProtoKeys: protoKeys,
        hasRender: typeof (inst as { render?: unknown }).render === "function",
        hasConnectAudio: typeof (inst as { connectAudio?: unknown }).connectAudio === "function",
      };
    }
    try {
      const lib = (globalThis as unknown as Record<string, unknown>)['__butterchurn_lib'];
      if (!lib) {return { error: "lib-missing" }};
      const create = (lib as unknown as { createVisualizer?: unknown, default?: { createVisualizer?: unknown } }).createVisualizer ?? (lib as unknown as { default?: { createVisualizer?: unknown } }).default?.createVisualizer;
      if (typeof create !== "function") {return { error: "create-not-function", libKeys: Object.keys(lib as Record<string, unknown>) };}

      const maybeDoc = (globalThis as unknown as Record<string, unknown>)['document'];
      const canvas = (maybeDoc as unknown as { createElement?: (tag: string) => unknown }).createElement?.('canvas') as unknown as { width?: number; height?: number };
      canvas.width = 64;
      canvas.height = 64;

      // Try to create a minimal AudioContext if available
      const maybeAudioCtor = (globalThis as unknown as Record<string, unknown>)['AudioContext'] ?? (globalThis as unknown as Record<string, unknown>)['webkitAudioContext'];
      let ctx: unknown = undefined;
      // eslint-disable-next-line unicorn/consistent-function-scoping, no-inner-declarations
      async function tryResume(maybeCtx: unknown): Promise<void> {
        try {
          const maybeResume = ((maybeCtx as unknown) as { resume?: unknown }).resume;
          if (typeof maybeResume === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            await (maybeResume as (...args: unknown[]) => Promise<unknown>).call(maybeCtx);
          }
        } catch {
          // ignore resume failures
        }
      }
      if (typeof maybeAudioCtor === 'function') {
        try {
          // eslint-disable-next-line new-cap
          ctx = new (maybeAudioCtor as unknown as { new(...args: unknown[]): unknown })();
          await tryResume(ctx);
        } catch {
          ctx = undefined;
        }
      }

      const attempts: { name: string; result: unknown }[] = [];



      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const inst = create(ctx as unknown, canvas, { width: 64, height: 64, pixelRatio: 1 }) as unknown;
        attempts.push({ name: "factoryCall", result: inspectInstance(inst) });
      } catch (error) {
        attempts.push({ name: "factoryCall", result: { error: String(error) } });
      }

      // Attempt various constructor signatures. Build the list conditionally so
      // we don't reference possibly-undefined variables directly in a way that
      // TypeScript would flag at build-time in the script file.
      const ctorSigs: unknown[][] = [];
      if (ctx !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ctorSigs.push([ctx, canvas, { width: 64, height: 64, pixelRatio: 1 }]);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ctorSigs.push([canvas, { width: 64, height: 64, pixelRatio: 1, audioContext: ctx }]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ctorSigs.push([canvas, ctx, { width: 64, height: 64, pixelRatio: 1 }]);
      ctorSigs.push([canvas, { width: 64, height: 64, pixelRatio: 1 }]);
      ctorSigs.push([canvas]);

      for (const args of ctorSigs) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
          const inst = Reflect.construct(create, args) as unknown;
          attempts.push({ name: `ctor:${args.length}`, result: inspectInstance(inst) });
        } catch (error) {
          attempts.push({ name: `ctor:${args.length}`, result: { error: String(error) } });
        }
      }

      return { error: undefined, attempts };
    } catch (error) {
      return { error: String(error) };
    }
  });

  // Print a readable JSON summary of the create attempts
  try {
    console.warn("debug-butterchurn: createInspect:", JSON.stringify(createInspect, undefined, JSON_SPACES));
  } catch {
    console.warn("debug-butterchurn: createInspect (raw):", createInspect);
  }

  // Output a concise diagnostic summary (use warn to satisfy lint rules)
  console.warn("debug-butterchurn: console messages (sample):", consoleMessages.slice(undefined, MAX_RESULTS));
  console.warn("debug-butterchurn: bad responses (sample):", badResponses.slice(undefined, MAX_RESULTS));

  // Intentionally omit closing the browser in this debug script to keep diagnostics available for inspection
}
try {
  await main();
} catch (error) {
  console.error('debug-butterchurn-network failed:', error);
  throw error;
}