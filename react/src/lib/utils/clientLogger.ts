/* oxlint-disable no-console */
// Minimal client-side logger wrapper. Keep a single, small file exempt from
// `no-console` so other modules can call `clientDebug` / `clientWarn` without
// sprinkling inline eslint-disable comments everywhere.

/**
 * Debug log wrapper (no-op in production when browsers suppress debug logs).
 *
 * @param args - Items to log to console.debug
 * @returns void
 */
export function clientDebug(...args: unknown[]): void {
	console.debug(...args);
}

/**
 * Standard log wrapper for general informational messages.
 *
 * @param args - Items to log to console.log
 * @returns void
 */
export function clientLog(...args: unknown[]): void {
	console.log(...args);
}

/**
 * Warning wrapper for recoverable issues.
 *
 * @param args - Items to log to console.warn
 * @returns void
 */
export function clientWarn(...args: unknown[]): void {
	console.warn(...args);
}

/**
 * Error wrapper for serious errors that warrant developer attention.
 *
 * @param args - Items to log to console.error
 * @returns void
 */
export function clientError(...args: unknown[]): void {
	console.error(...args);
}
