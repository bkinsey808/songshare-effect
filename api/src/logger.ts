/* oxlint-disable no-console */
// Centralized server-side logger used to keep debug/error calls in one place.
// Keep a single, file-scoped disable here so other files don't need per-line

// no default logger value; individual functions are exported instead
// oxlint-disable comments for console usage.

/**
 * Log informational messages to stdout.
 *
 * @param args - Values to log
 * @returns void
 */
export function log(...args: unknown[]): void {
	console.log(...args);
}

/**
 * Log debug-level messages to stdout (lower priority).
 *
 * @param args - Values to log
 * @returns void
 */
export function debug(...args: unknown[]): void {
	// Use console.debug for lower-priority logs
	console.debug(...args);
}

/**
 * Log warnings to stderr.
 *
 * @param args - Values to log
 * @returns void
 */
export function warn(...args: unknown[]): void {
	console.warn(...args);
}

/**
 * Log error messages to stderr.
 *
 * @param args - Values to log
 * @returns void
 */
export function error(...args: unknown[]): void {
	console.error(...args);
}

// default export removed in favor of named exports only
