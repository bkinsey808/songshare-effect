/* eslint-disable no-console */
// Centralized server-side logger used to keep debug/error calls in one place.
// Keep a single, file-scoped disable here so other files don't need per-line
// eslint-disable comments for console usage.
export function log(...args: unknown[]): void {
	console.log(...args);
}

export function debug(...args: unknown[]): void {
	// Use console.debug for lower-priority logs
	console.debug(...args);
}

export function warn(...args: unknown[]): void {
	console.warn(...args);
}

export function error(...args: unknown[]): void {
	console.error(...args);
}

type Logger = {
	readonly log: (...args: unknown[]) => void;
	readonly debug: (...args: unknown[]) => void;
	readonly warn: (...args: unknown[]) => void;
	readonly error: (...args: unknown[]) => void;
};

const logger: Logger = { log, debug, warn, error };

export default logger;
