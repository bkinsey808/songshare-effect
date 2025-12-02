import { useEffect } from "react";

import { clientDebug } from "@/react/utils/clientLogger";

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
			// Print a concise trace; React's console will show it with other logs
			// and our Puppeteer capture will pick it up.
			// Debug-only trace output — allowed for dev tooling.
			clientDebug("HOOK TRACE:", buffer.join(" -> "));
		}
		// Clear after logging so subsequent commits start fresh.
		buffer.length = 0;
	});
}

// Named export for tooling-friendly imports
// Intentionally no default or object export — consumers should import named functions
