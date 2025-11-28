/* oxlint-disable no-console, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-confusing-void-expression */
// CommonJS-compatible script logger for legacy scripts using require()
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

module.exports = { log, debug, warn, error };
