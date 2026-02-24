// symbol key must match the one used in the implementation
export const SYMBOL_KEY = Symbol.for("__supabaseClients__");

// helper that explicitly clears the cached map so each test starts cleanly
export function clearGlobalCache(): void {
	// use Reflect.deleteProperty to remove the symbol from globalThis without
	// tripping the no-dynamic-delete lint rule.  casting through `unknown` gives
	// us type safety without resorting to `any`.
	// assertion narrows globalThis but we only use it locally; keep the
	// disable confined to this helper so tests remain clean.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const globalRecord = globalThis as unknown as Record<symbol, unknown>;
	Reflect.deleteProperty(globalRecord, SYMBOL_KEY as symbol);
}

/**
 * Read the current cached map from globalThis. Using a function ensures tests
 * can observe updates that happen after the module loads.
 */
export function supabaseClientsValue(): Map<string, unknown> | undefined {
	// narrow typing here is safe for our testing needs; disable lint on these
	// lines to avoid noise elsewhere.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const globalRecord = globalThis as unknown as Record<symbol, unknown>;
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return globalRecord[SYMBOL_KEY as symbol] as Map<string, unknown> | undefined;
}
