import { useEffect, useState } from "react";

/**
 * Returns the current online status and subscribes to browser online/offline
 * events to keep the value up to date.
 *
 * @returns `true` when the browser has network connectivity, otherwise `false`
 */
export default function useIsOnline(): boolean {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	// Listen to browser online/offline events and keep `isOnline` state updated
	useEffect(() => {
		/**
		 * Browser `online` event handler — mark the app as online.
		 *
		 * @returns void
		 */
		function handleOnline(): void {
			setIsOnline(true);
		}
		/**
		 * Browser `offline` event handler — mark the app as offline.
		 *
		 * @returns void
		 */
		function handleOffline(): void {
			setIsOnline(false);
		}
		globalThis.addEventListener("online", handleOnline);
		globalThis.addEventListener("offline", handleOffline);
		return (): void => {
			globalThis.removeEventListener("online", handleOnline);
			globalThis.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}
