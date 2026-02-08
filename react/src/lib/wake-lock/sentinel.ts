/**
 * Module-local storage for the Wake Lock sentinel.
 *
 * Exposes getter/setter functions instead of a mutable exported binding because
 * ES module imports are live-read-only, so assignment to an imported `let` is not allowed.
 */
let sentinel: WakeLockSentinel | undefined = undefined;

/**
 * Get the current Wake Lock sentinel (or undefined if not set).
 *
 * @returns The current `WakeLockSentinel` or `undefined`
 */
export function getWakeLockSentinel(): WakeLockSentinel | undefined {
	return sentinel;
}

/**
 * Set the current Wake Lock sentinel (or undefined to clear it).
 *
 * @param value - New sentinel value or `undefined` to clear
 * @returns void
 */
export function setWakeLockSentinel(value: WakeLockSentinel | undefined): void {
	sentinel = value;
}
