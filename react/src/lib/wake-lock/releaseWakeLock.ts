import { getWakeLockSentinel, setWakeLockSentinel } from "./sentinel";

/**
 * Release the active wake lock if present.
 *
 * Clears the sentinel after releasing and logs errors without throwing.
 */
export default async function releaseWakeLock(): Promise<void> {
	const sentinel = getWakeLockSentinel();
	if (sentinel !== undefined) {
		try {
			await sentinel.release();
			setWakeLockSentinel(undefined);
		} catch (error: unknown) {
			console.error("Failed to release wake lock:", error);
		}
	}
}
