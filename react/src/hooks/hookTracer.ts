import { useEffect } from "react";

import { clientWarn } from "../utils/clientLogger";

// Lightweight render-time hook tracer for debugging hook-order issues.
// Use startHookTrace() at the top of a render tree, call traceHook(name)
// from components/hooks during render, and call useLogHookTrace() to
// print the captured order after commit.
const buffer: string[] = [];
const ZERO = 0;

export function startHookTrace(): void {
	buffer.length = 0;
}

export function traceHook(name: string): void {
	buffer.push(name);
}

export function useLogHookTrace(): void {
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
