import { useEffect, useState } from "react";

import releaseWakeLock from "./releaseWakeLock";
import requestWakeLock from "./requestWakeLock";
import { getWakeLockSentinel } from "./sentinel";

/**
 * Manage a screen wake lock using the Wake Lock API.
 *
 * Attempts to enable the wake lock on mount (default ON) and will automatically
 * re-request the lock when the page becomes visible again (many browsers release
 * locks when a page becomes hidden).
 *
 * @returns
 *   isWakeLockActive - true when a wake lock is currently held
 *   toggleWakeLock - toggles the wake lock on or off
 *   isSupported - true when the Wake Lock API is available in the runtime
 */
export default function useWakeLock(): {
	isWakeLockActive: boolean;
	toggleWakeLock: () => void;
	isSupported: boolean;
} {
	// Whether a wake lock is currently held.
	const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
	// Detect Wake Lock API support. Use a lazy initializer so this read is safe
	// in SSR or test environments where `navigator` may be undefined.
	const [isSupported] = useState<boolean>(() => "wakeLock" in navigator);

	// Request wake lock on mount (default ON). Some browsers release wake locks when
	// the document becomes hidden, so we also re-request when visibility changes back
	// to 'visible'.
	useEffect(() => {
		if (!isSupported) {
			return;
		}

		/**
		 * Initialize the wake lock by attempting to request it and updating state.
		 *
		 * @returns void
		 */
		async function initWakeLock(): Promise<void> {
			const success = await requestWakeLock();
			setIsWakeLockActive(success);
		}

		void initWakeLock();

		// Re-acquire wake lock when page becomes visible again (e.g., Chrome releases
		// the lock when a page is hidden). Only attempt when we don't already have a sentinel.
		/**
		 * Re-request the wake lock when the document becomes visible again and no sentinel exists.
		 *
		 * @returns void
		 */
		function handleVisibilityChange(): void {
			if (document.visibilityState === "visible" && getWakeLockSentinel() === undefined) {
				void (async (): Promise<void> => {
					const success = await requestWakeLock();
					setIsWakeLockActive(success);
				})();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return (): void => {
			// Clean up: remove visibility listener and release any held wake lock.
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			void releaseWakeLock();
		};
	}, [isSupported]);

	// Toggle the wake lock on or off.
	// Uses an internal async function so the exported `toggleWakeLock` remains synchronous to callers.
	/**
	 * Toggle the wake lock state. When active, it releases the lock; otherwise it requests a lock.
	 *
	 * The exposed `toggleWakeLock` is synchronous; the actual work runs in an async helper.
	 *
	 * @returns void
	 */
	function toggleWakeLock(): void {
		/**
		 * Internal async toggle implementation.
		 *
		 * @returns Promise<void>
		 */
		async function toggle(): Promise<void> {
			if (isWakeLockActive) {
				await releaseWakeLock();
				setIsWakeLockActive(false);
			} else {
				const success = await requestWakeLock();
				setIsWakeLockActive(success);
			}
		}
		void toggle();
	}

	return {
		isWakeLockActive,
		toggleWakeLock,
		isSupported,
	};
}
