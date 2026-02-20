import { act, useEffect, useRef, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import attachFakeCanvas2DContext from "./fakeCanvasContext";
import { useCanvasAnimation, type DrawFn } from "./useCanvasAnimation";

// Local test-friendly API type for the hook. Using an explicit type avoids
// linter rules that treat `useCanvasAnimation()` as untyped in the test
// environment.
type CanvasAnimationApi = {
	start: (
		canvas: HTMLCanvasElement,
		draw: DrawFn,
		options: { loop: boolean; duration: number; onFinish?: () => void },
	) => void;
	stop: () => void;
	isRunning: () => boolean;
};

const RAF_MS = 16;
const DURATION = 1000;
const DOUBLE_DURATION = DURATION + DURATION;

function assertIsCanvas(node: unknown): asserts node is HTMLCanvasElement {
	expect(node).toBeInstanceOf(HTMLCanvasElement);
}
function assertIsApi(node: unknown): asserts node is CanvasAnimationApi {
	expect(node).toBeDefined();
}

function TestHarness({ onApi }: { onApi: (api: CanvasAnimationApi) => void }): ReactElement {
	// The hook is a local runtime value inside the test harness. Narrow it
	// into the explicit test API using a runtime assertion helper to avoid
	// inline eslint disable comments and unsafe casts.
	const apiAny = useCanvasAnimation();
	assertIsApi(apiAny);
	const api = apiAny;
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// Expose the hook's runtime API to the test harness when the component mounts
	useEffect(() => {
		onApi(api);
	}, [api, onApi]);

	return <canvas ref={canvasRef} width={100} height={100} />;
}

describe("useCanvasAnimation (integration)", () => {
	function setupFakeRaf(): void {
		vi.useFakeTimers();
		// Use a simple stub for RAF that schedules the callback on the fake timers
		vi.stubGlobal("requestAnimationFrame", (frameCb: FrameRequestCallback) => {
			const id = Number(
				globalThis.setTimeout(() => {
					queueMicrotask(() => {
						frameCb(performance.now());
					});
				}, RAF_MS),
			);
			return id;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => {
			clearTimeout(Number(id));
		});
	}

	it("starts and stops and respects duration when loop=false", () => {
		setupFakeRaf();
		const container = document.createElement("div");
		const root = createRoot(container);

		let apiRef: { current?: CanvasAnimationApi } = {};

		act(() => {
			root.render(<TestHarness onApi={(api) => (apiRef.current = api)} />);
		});

		assertIsApi(apiRef.current);
		const api = apiRef.current;

		const canvasNode = container.querySelector("canvas");
		assertIsCanvas(canvasNode);
		const canvas = canvasNode;

		// Provide a minimal fake 2D context for the JSDOM canvas
		attachFakeCanvas2DContext(canvas);

		act(() => {
			api.start(
				canvas,
				(ctx: CanvasRenderingContext2D) => {
					ctx.save();
					ctx.restore();
				},
				{ loop: false, duration: DURATION },
			);
		});

		expect(api.isRunning()).toBe(true);

		// advance timers to trigger timeout
		act(() => {
			vi.advanceTimersByTime(DURATION);
		});

		expect(api.isRunning()).toBe(false);

		act(() => {
			root.unmount();
		});

		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("keeps running when loop=true until stop is called", () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		setupFakeRaf();
		let apiRef: { current?: CanvasAnimationApi } = {};

		act(() => {
			root.render(<TestHarness onApi={(api) => (apiRef.current = api)} />);
		});

		assertIsApi(apiRef.current);
		const api = apiRef.current;

		const canvasNode = container.querySelector("canvas");
		assertIsCanvas(canvasNode);
		const canvas = canvasNode;

		Object.defineProperty(canvas, "getContext", {
			value: (_contextId?: string): Partial<CanvasRenderingContext2D> => ({
				canvas: canvas,
				clearRect: (..._args: unknown[]): void => {
					void _args;
				},
				fillRect: (..._args: unknown[]): void => {
					void _args;
				},
				fillText: (_text: string, _x: number, _y: number): void => {
					void _text;
					void _x;
					void _y;
				},
				save: (): void => {
					/* no-op */
				},
				restore: (): void => {
					/* no-op */
				},
			}),
		});

		act(() => {
			api.start(
				canvas,
				(ctx: CanvasRenderingContext2D) => {
					ctx.save();
					ctx.restore();
				},
				{ loop: true, duration: DURATION },
			);
		});

		expect(api.isRunning()).toBe(true);

		// advance beyond the duration; because loop=true, it should still be running
		act(() => {
			vi.advanceTimersByTime(DOUBLE_DURATION);
		});

		expect(api.isRunning()).toBe(true);

		act(() => {
			api.stop();
		});

		expect(api.isRunning()).toBe(false);

		act(() => {
			root.unmount();
		});
	});

	it("passes timestamp and delta time to draw", async () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		setupFakeRaf();
		let apiRef: { current?: CanvasAnimationApi } = {};

		act(() => {
			root.render(<TestHarness onApi={(api) => (apiRef.current = api)} />);
		});

		assertIsApi(apiRef.current);
		const api = apiRef.current;

		const canvasNode = container.querySelector("canvas");
		assertIsCanvas(canvasNode);
		const canvas = canvasNode;

		Object.defineProperty(canvas, "getContext", {
			value: (_contextId?: string): Partial<CanvasRenderingContext2D> => ({
				canvas: canvas,
				clearRect: (..._args: unknown[]): void => {
					void _args;
				},
			}),
		});

		const calls: { frame: number; now?: unknown; dt?: unknown }[] = [];
		const RAF_TICKS_TO_ADVANCE = 2;
		const SECOND_INDEX = 1;
		const MIN_DT_THRESHOLD = 0;
		const FRAME_INDEX = 1;
		const NOW_INDEX = 2;
		const DT_INDEX = 3;

		act(() => {
			api.start(
				canvas,
				(...args: unknown[]) => {
					const frame = Number(args[FRAME_INDEX]);
					const nowAny = args[NOW_INDEX];
					const dtAny = args[DT_INDEX];
					calls.push({ frame, now: nowAny, dt: dtAny });
				},
				{ loop: true, duration: DURATION },
			);
		});

		// Advance timers in two steps so that the RAF scheduled during the
		// first frame has a chance to be enqueued before we advance again.
		act(() => {
			vi.advanceTimersByTime(RAF_MS);
		});
		await Promise.resolve();
		act(() => {
			vi.advanceTimersByTime(RAF_MS);
		});
		await Promise.resolve();

		expect(calls.length).toBeGreaterThanOrEqual(RAF_TICKS_TO_ADVANCE);
		const secondCall = calls[SECOND_INDEX];
		const sc = secondCall;
		const dtNum = Number(sc?.dt);
		expect(Number.isFinite(dtNum)).toBe(true);
		expect(dtNum).toBeGreaterThan(MIN_DT_THRESHOLD);

		act(() => {
			api.stop();
			root.unmount();
		});
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
});
