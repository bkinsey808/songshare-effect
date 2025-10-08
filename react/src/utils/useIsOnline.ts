import { useEffect, useState } from "react";

export function useIsOnline(): boolean {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	useEffect(() => {
		const handleOnline = (): void => {
			setIsOnline(true);
		};
		const handleOffline = (): void => {
			setIsOnline(false);
		};
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return isOnline;
}
