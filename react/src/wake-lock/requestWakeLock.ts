import { setWakeLockSentinel } from "./sentinel";

/**
 * Request a screen wake lock if supported.
 *
 * Stores the returned WakeLockSentinel via `setWakeLockSentinel` for later release.
 * Returns `true` when the lock was successfully acquired.
 */
export default async function requestWakeLock(): Promise<boolean> {
	if (!("wakeLock" in navigator)) {
		console.warn("Wake Lock API not supported");
		return false;
	}

	try {
		const sentinel = await navigator.wakeLock.request("screen");
		setWakeLockSentinel(sentinel);
		return true;
	} catch (error: unknown) {
		console.error("Failed to request wake lock:", error);
		return false;
	}
}
