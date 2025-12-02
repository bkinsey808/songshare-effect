/* oxlint-disable no-console */

// Centralized script logger for scripts in the `scripts/` directory.
// Use this module to avoid sprinkling `console.*` calls throughout many script files
// and to centralize any script-specific formatting/behavior later.

type ScriptLogger = {
	readonly log: (...args: unknown[]) => void;
	readonly debug: (...args: unknown[]) => void;
	readonly warn: (...args: unknown[]) => void;
	readonly error: (...args: unknown[]) => void;
};

const scriptLogger: ScriptLogger = { log, debug, warn, error };

export function log(...args: unknown[]): void {
	console.log(...args);
}

export function debug(...args: unknown[]): void {
	console.debug(...args);
}

export function warn(...args: unknown[]): void {
	console.warn(...args);
}

export function error(...args: unknown[]): void {
	console.error(...args);
}

export default scriptLogger;
