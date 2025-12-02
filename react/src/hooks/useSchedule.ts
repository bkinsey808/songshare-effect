import { useEffect, useRef } from "react";

// Hook that returns a schedule function which runs callbacks on the
// microtask queue (queueMicrotask or Promise.resolve().then) and avoids
// calling callbacks after the component has unmounted.
export default function useSchedule(): (fn: () => void) => void {
	const mounted = useRef(true);

	useEffect((): (() => void) | void => {
		mounted.current = true;
		return (): void => {
			mounted.current = false;
		};
	}, []);

	function schedule(fn: () => void): void {
		function wrapper(): void {
			if (!mounted.current) {
				return;
			}
			fn();
		}

		if (typeof queueMicrotask === "function") {
			queueMicrotask(wrapper);
		} else {
			// Use an async IIFE and await the already-resolved promise so we don't
			// use `.then()` while still scheduling a microtask when queueMicrotask
			// isn't available. The returned promise is intentionally ignored.
			void (async (): Promise<void> => {
				await Promise.resolve();
				wrapper();
			})();
		}
	}

	return schedule;
}
