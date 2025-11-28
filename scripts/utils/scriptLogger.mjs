/* oxlint-disable no-console, @typescript-eslint/no-unsafe-argument */
export function log(...args) {
	console.log(...args);
}

export function debug(...args) {
	console.debug(...args);
}

export function warn(...args) {
	console.warn(...args);
}

export function error(...args) {
	console.error(...args);
}

export default { log, debug, warn, error };
