/**
 * Test helpers for quiet-client tests.
 * Uses console/Reflect for setup; disables localized here.
 */
/* oxlint-disable no-console, typescript/no-unsafe-type-assertion -- test helpers intentionally use console for setup/teardown */

/**
 * Read the current `console.debug` implementation for restoration in tests.
 *
 * @returns The current `console.debug` function value.
 */
export function getConsoleDebug(): unknown {
	return console.debug;
}

/**
 * Replace `console.debug` with a test-provided value.
 *
 * @param value - Replacement function or sentinel value for `console.debug`.
 * @returns void
 */
export function setConsoleDebug(value: unknown): void {
	console.debug = value as typeof console.debug;
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */

/**
 * Read the current `console.timeStamp` value if present.
 *
 * @returns The current `console.timeStamp` property value.
 */
export function getConsoleTimeStamp(): unknown {
	return Reflect.get(console, "timeStamp");
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */

/**
 * Replace `console.timeStamp` with a test-provided value.
 *
 * @param value - Replacement value for `console.timeStamp`.
 * @returns void
 */
export function setConsoleTimeStamp(value: unknown): void {
	Reflect.set(console, "timeStamp", value);
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */

/**
 * Delete `console.timeStamp` from the console object.
 *
 * @returns Whether the property deletion succeeded.
 */
export function deleteConsoleTimeStamp(): boolean {
	return Reflect.deleteProperty(console, "timeStamp");
}
