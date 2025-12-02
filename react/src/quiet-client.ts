/* oxlint-disable no-console */
// Small module that silences console.debug and console.timeStamp in dev.
// Keep this file minimal and use safe runtime checks instead of broad
// eslint-disable blocks so it can be linted normally.

import { isRecord } from "@/shared/utils/typeGuards";

try {
	// Narrow globalThis before mutating it (avoid unsafe casts)
	const globalObj: unknown = globalThis;
	if (isRecord(globalObj)) {
		// Save original console.debug if present
		if (typeof console.debug === "function") {
			// Save the original debug function on the global object so it can be restored by dev tooling

			globalObj["__origConsoleDebug"] = console.debug.bind(console);
		}

		// Make debug a no-op
		if (typeof console.debug === "function") {
			// Replace debug with a no-op so dev logs don't spam during demos

			console.debug = (): void => {
				/* no-op */
			};
		}

		// If timeStamp is available, silence it as well
		// Use Reflect to access potentially non-standard console APIs without unsafe assertions
		const maybeTimeStamp = Reflect.get(console, "timeStamp") as unknown;
		if (typeof maybeTimeStamp === "function") {
			Reflect.set(console, "timeStamp", (): void => {
				/* no-op */
			});
		}
	} else {
		// Not an object-shaped global object — bail early
	}
} catch {
	// ignore errors during bootstrap
}

// Module contains runtime-only side effects; no exports required
