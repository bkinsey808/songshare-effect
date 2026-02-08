import { useEffect, useRef } from "react";

/**
 * Returns a scheduling helper that runs callbacks on the microtask queue
 * and prevents running callbacks after the component has unmounted.
 *
 * @returns A `schedule(fn)` function that queues `fn` as a microtask
 */
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
