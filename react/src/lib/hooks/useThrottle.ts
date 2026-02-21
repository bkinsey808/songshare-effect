import { useLayoutEffect, useRef, useState } from "react";

/**
 * Result returned by `useThrottle`.
 *
 * The returned function has a `flush()` method that will immediately invoke any
 * pending call and clear the throttle window.  The identity of the function is
 * stable across renders.
 */
/**
 * Result returned by `useThrottle`.
 *
 * - `throttled` is the function you call normally.
 * - `flush` forces any pending invocation to run immediately.
 *
 * Keeping them as separate properties makes it easy for callers to destructure
 * without having to reach through a property on a function.
 */
export type UseThrottleResult<Args extends unknown[]> = {
	throttled: (...args: Args) => void;
	flush: () => void;
};

/**
 * Creates a throttled version of a callback that executes on the leading edge
 * and will also execute a trailing invocation if calls were made during the
 * throttle window.
 *
 * Example:
 * ```tsx
 * const throttled = useThrottle((value) => doSave(value), 250);
 * throttled("a"); // immediately invokes doSave("a")
 * throttled("b"); // ignored for now, next invocation will send "b"
 * throttled("c"); // replaces pending value with "c"
 * // after 250ms flushes doSave("c") automatically
 * ```
 *
 * The `flush` method is handy for page unload handlers or test helpers; it is
 * safe to call even if there is no pending invocation.
 *
 * @param fn - callback to throttle
 * @param delay - window duration in milliseconds
 */
// generic parameter `Fn` is broad enough to accept any argument tuple;
// the implementation uses `Parameters<Fn>` for type-safe handling.
export default function useThrottle<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delay: number,
): UseThrottleResult<Args> {
	// track latest callback in a ref; updated after render
	const fnRef = useRef<(...args: Args) => void>(fn);
	useLayoutEffect(() => {
		fnRef.current = fn;
	}, [fn]);

	// keep delay in a ref as well so the throttled logic can use the latest
	// value without needing to rebuild the wrapper.
	const delayRef = useRef(delay);

	useLayoutEffect(() => {
		delayRef.current = delay;
	}, [delay]);

	// the throttled function (and its companion `flush`) are computed lazily
	// inside state.  storing the object in state lets us avoid accessing any
	// refs during render while still preserving stable identities forever.
	const [{ throttled, flush }] = useState<UseThrottleResult<Args>>(() => {
		let timer: ReturnType<typeof setTimeout> | undefined = undefined;
		let pending = false;
		let latestArgs: Args | undefined = undefined;

		function doFlush(): void {
			if (timer !== undefined) {
				clearTimeout(timer);
				timer = undefined;
			}

			if (pending && latestArgs) {
				pending = false;
				fnRef.current(...latestArgs);
				latestArgs = undefined;
			}
		}

		function inner(...args: Args): void {
			latestArgs = args;

			if (timer !== undefined) {
				pending = true;
				return;
			}

			// leading-edge invocation
			fnRef.current(...args);
			pending = false;

			function runTrailing(): void {
				// clear current timer immediately so new calls can start a fresh
				// window.  we only create a new timer if there is still pending work
				// after flushing.
				timer = undefined;
				if (!pending || !latestArgs) {
					return;
				}
				pending = false;
				fnRef.current(...latestArgs);
				latestArgs = undefined;
				if (pending) {
					// more calls came in synchronously during the callback
					timer = setTimeout(runTrailing, delayRef.current);
				}
			}

			timer = setTimeout(runTrailing, delayRef.current);
		}

		return { throttled: inner, flush: doFlush };
	});

	return { throttled, flush };
}
