/* oxlint-disable no-console, @typescript-eslint/no-unsafe-argument */
function log(...args) {
	console.log(...args);
}

function debug(...args) {
	console.debug(...args);
}

function warn(...args) {
	console.warn(...args);
}

function error(...args) {
	console.error(...args);
}

const logger = { log, debug, warn, error };
export { log, debug, warn, error };
export default logger;
