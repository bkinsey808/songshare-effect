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

	useEffect(() => {
		function handleOnline(): void {
			setIsOnline(true);
		}
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
