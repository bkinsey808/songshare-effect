import { useEffect } from "react";

// Lightweight render-time hook tracer for debugging hook-order issues.
// Use startHookTrace() at the top of a render tree, call traceHook(name)
// from components/hooks during render, and call useLogHookTrace() to
// print the captured order after commit.
import { ZERO } from "@/shared/constants/shared-constants";

import { clientWarn } from "../utils/clientLogger";
const buffer: string[] = [];

/**
 * Begin a fresh hook trace buffer used for debugging hook call order.
 * Call this at the top of a render tree before `traceHook` calls are made.
 *
 * @returns void
 */
export function startHookTrace(): void {
	buffer.length = 0;
}

/**
 * Record a hook invocation name into the trace buffer for later logging.
 * Call this from component/hook render bodies to capture order.
 *
 * @param name - Short name to identify the hook or component
 * @returns void
 */
export function traceHook(name: string): void {
	buffer.push(name);
}

/**
 * Effect hook that logs the accumulated hook trace buffer after commit and
 * clears it. Useful during debugging to print hook invocation order.
 *
 * @returns void
 */
export function useLogHookTrace(): void {
	// After each render commit, log whatever hook names were traced and clear the buffer
	useEffect(() => {
		if (buffer.length > ZERO) {
			// Make the hook-order trace visible even when console.debug is filtered
			// by the browser devtools. Use warn so it's not hidden by default.
			clientWarn("HOOK TRACE:", buffer.join(" -> "));
			// Also emit a plain console.warn to make it unmistakable in the
			// browser console (some environments strip console.debug).
			console.warn("HOOK TRACE:", buffer.join(" -> "));
		}
		// Clear after logging so subsequent commits start fresh.
		buffer.length = 0;
	});
}

// Named export for tooling-friendly imports
// Intentionally no default or object export — consumers should import named functions
