import { useEffect, useRef } from "react";

// Hook that returns a schedule function which runs callbacks on the
// microtask queue (queueMicrotask or Promise.resolve().then) and avoids
// calling callbacks after the component has unmounted.
export default function useSchedule(): (fn: () => void) => void {
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	const schedule = (fn: () => void): void => {
		const wrapper = (): void => {
			if (!mounted.current) {
				return;
			}
			fn();
		};

		if (typeof queueMicrotask === "function") {
			queueMicrotask(wrapper);
		} else {
			// Explicitly ignore the returned promise to satisfy lint rules
			void Promise.resolve().then(wrapper);
		}
	};

	return schedule;
}
