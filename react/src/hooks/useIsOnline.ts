import { useEffect, useState } from "react";

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
