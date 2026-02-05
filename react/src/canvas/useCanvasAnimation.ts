import { useRef } from "react";

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

/**
 * Signature for the per-frame draw callback used by `useCanvasAnimation`.
 *
 * - `ctx` is a standard Canvas 2D rendering context.
 * - `frame` is an incrementing frame counter (starts at 1 and increments by 1
 *   each RAF tick).
 * - `now` is the high-resolution DOM timestamp (milliseconds) provided by
 *   `requestAnimationFrame` for this tick.
 * - `dt` is the time in milliseconds since the previous frame (0 for the
 *   first frame).
 */
export type DrawFn = (
	ctx: CanvasRenderingContext2D,
	frame: number,
	now?: number,
	dt?: number,
) => void;

// -----------------------------------------------------------------------------
// Hook: useCanvasAnimation
// -----------------------------------------------------------------------------

/**
 * A small hook that manages a canvas animation loop using requestAnimationFrame
 * and an optional duration-based timeout.
 *
 * Responsibilities:
 * - start an animation that calls your `draw` callback on every RAF tick
 * - cancel any previously running animation when `start` is called again
 * - provide a `stop()` method to terminate the animation early
 * - automatically stop after `duration` ms when `loop` is false
 *
 * Notes:
 * - The hook stores RAF and timeout IDs in refs so values persist across
 *   renders without triggering re-renders.
 * - The `draw` callback receives a real `CanvasRenderingContext2D` object.
 *
 * @returns Object with `start`, `stop` and `isRunning` helpers for controlling animation
 */
export function useCanvasAnimation(): {
	/**
	 * Start rendering frames into `canvas`.
	 *
	 * - `canvas`: the canvas to draw into (must be attached to the DOM).
	 * - `draw`: a function invoked every frame with (ctx, frame).
	 * - `options.loop`: if true, the animation continues until `stop()` is
	 *   called; otherwise it stops after `options.duration` ms and calls
	 *   `options.onFinish` if provided.
	 */
	start: (
		canvas: HTMLCanvasElement,
		draw: DrawFn,
		options: { loop: boolean; duration: number; onFinish?: () => void },
	) => void;
	/** Stop the running animation (if any) immediately. */
	stop: () => void;
	/** Return whether an animation is currently running. */
	isRunning: () => boolean;
} {
	// store raf id so we can cancel it later without re-rendering
	const rafRef = useRef<number | undefined>(undefined);
	// store timeout id used to stop non-looping animations
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	// increment per-frame counter, kept as a constant for clarity and easy tuning
	const FRAME_STEP = 1;
	// initial delta time value used for the first frame (avoids magic numbers)
	const INITIAL_DT = 0;

	/**
	 * Stop helper: cancels the active requestAnimationFrame and timeout (if any).
	 * Uses refs so it's safe to call from callbacks without stale closures.
	 */
	function stop(): void {
		// cancel RAF if scheduled
		if (rafRef.current !== undefined) {
			const id = rafRef.current;
			cancelAnimationFrame(id);
			rafRef.current = undefined;
		}

		// cancel timeout if scheduled
		if (timeoutRef.current !== undefined) {
			const t = timeoutRef.current;
			clearTimeout(t);
			timeoutRef.current = undefined;
		}
	}

	/**
	 * Start the animation loop.
	 *
	 * Implementation notes:
	 * - Calls `stop()` to ensure only one animation runs at a time.
	 * - Obtains a 2D drawing context from the canvas and exits silently if
	 *   unavailable (e.g., canvas not attached or context creation failed).
	 * - Uses a local `frame` counter and `requestAnimationFrame` to drive
	 *   rendering; the provided `draw` callback is invoked each tick.
	 * - If `options.loop` is false, a timeout is scheduled to stop the
	 *   animation after `options.duration` milliseconds and call
	 *   `options.onFinish()` if provided.
	 */
	function start(
		canvas: HTMLCanvasElement,
		draw: DrawFn,
		options: { loop: boolean; duration: number; onFinish?: () => void },
	): void {
		// ensure previous run stopped
		stop();

		// Acquire a 2D drawing context. If it's not available, abort.
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}
		const drawCtx = ctx;

		let frame = 0;
		let lastTime: number | undefined = undefined;

		// Animation frame callback. We receive a high-resolution timestamp from
		// RAF (`now`), compute `dt` since the previous tick, invoke the
		// user-supplied `draw` callback with (ctx, frame, now, dt) and schedule
		// the next RAF tick.
		function anim(now: number): void {
			const dt = lastTime === undefined ? INITIAL_DT : now - lastTime;
			lastTime = now;
			frame += FRAME_STEP;
			// `drawCtx` is a CanvasRenderingContext2D
			draw(drawCtx, frame, now, dt);
			rafRef.current = requestAnimationFrame(anim);
		}

		// Kick off the RAF loop
		rafRef.current = requestAnimationFrame(anim);

		// If not looping, schedule a timeout that stops the animation and
		// optionally calls the `onFinish` callback.
		if (!options.loop) {
			timeoutRef.current = globalThis.setTimeout(() => {
				stop();
				options.onFinish?.();
			}, options.duration);
		}
	}

	return { start, stop, isRunning: () => rafRef.current !== undefined };
}
