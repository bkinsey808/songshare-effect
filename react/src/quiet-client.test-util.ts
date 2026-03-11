/**
 * Test helpers for quiet-client tests.
 * Uses console/Reflect for setup; disables localized here.
 */
/* oxlint-disable no-console, typescript/no-unsafe-type-assertion -- test helpers intentionally use console for setup/teardown */
export function getConsoleDebug(): unknown {
	return console.debug;
}
export function setConsoleDebug(value: unknown): void {
	console.debug = value as typeof console.debug;
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */
export function getConsoleTimeStamp(): unknown {
	return Reflect.get(console, "timeStamp");
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */
export function setConsoleTimeStamp(value: unknown): void {
	Reflect.set(console, "timeStamp", value);
}
/* oxlint-disable-next-line no-console -- test helpers intentionally use console for setup/teardown */
export function deleteConsoleTimeStamp(): boolean {
	return Reflect.deleteProperty(console, "timeStamp");
}
