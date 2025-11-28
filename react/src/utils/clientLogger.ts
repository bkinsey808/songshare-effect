/* oxlint-disable no-console */
// Minimal client-side logger wrapper. Keep a single, small file exempt from
// `no-console` so other modules can call `clientDebug` / `clientWarn` without
// sprinkling inline eslint-disable comments everywhere.
export function clientDebug(...args: unknown[]): void {
	console.debug(...args);
}

export function clientLog(...args: unknown[]): void {
	console.log(...args);
}

export function clientWarn(...args: unknown[]): void {
	console.warn(...args);
}

export function clientError(...args: unknown[]): void {
	console.error(...args);
}
