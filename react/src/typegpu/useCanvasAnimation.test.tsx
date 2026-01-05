import { useRef, useEffect, act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useCanvasAnimation } from "./useCanvasAnimation";
import attachFakeCanvas2DContext from "./fakeCanvasContext";

const RAF_MS = 16;
const DURATION = 1000;
const DOUBLE_DURATION = DURATION + DURATION;


function TestHarness({
	onApi,
}: {
	onApi: (api: ReturnType<typeof useCanvasAnimation>) => void;
}): ReactElement {
	const api = useCanvasAnimation();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		onApi(api);
	}, [api, onApi]);

	return <canvas ref={canvasRef} width={100} height={100} />;
}

describe("useCanvasAnimation (integration)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Use a simple stub for RAF that schedules the callback on the fake timers
		vi.stubGlobal("requestAnimationFrame", (frameCb: FrameRequestCallback) => {
			const id = Number(
				globalThis.setTimeout(() => {
				queueMicrotask(() => { frameCb(performance.now()); });
				}, RAF_MS),
			);
			return id;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => {
			clearTimeout(Number(id));
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("starts and stops and respects duration when loop=false", () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		let apiRef: { current?: ReturnType<typeof useCanvasAnimation> } = {};

		act(() => {
			root.render(<TestHarness onApi={(api) => (apiRef.current = api)} />);
		});

		expect(apiRef.current).not.toBeUndefined();
		if (apiRef.current === undefined) {
			return;
		}
		const api = apiRef.current;

		const canvasNode = container.querySelector("canvas");
		expect(canvasNode).toBeInstanceOf(HTMLCanvasElement);
		if (!(canvasNode instanceof HTMLCanvasElement)) {
			return;
		}
		const canvas = canvasNode;

		// Provide a minimal fake 2D context for the JSDOM canvas
		attachFakeCanvas2DContext(canvas);

		act(() => {
			api.start(
				canvas,
				(ctx) => {
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
	});

	it("keeps running when loop=true until stop is called", () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		let apiRef: { current?: ReturnType<typeof useCanvasAnimation> } = {};

		act(() => {
			root.render(<TestHarness onApi={(api) => (apiRef.current = api)} />);
		});

		expect(apiRef.current).not.toBeUndefined();
		if (apiRef.current === undefined) {
			return;
		}
		const api = apiRef.current;

		const canvasNode = container.querySelector("canvas");
		expect(canvasNode).toBeInstanceOf(HTMLCanvasElement);
		if (!(canvasNode instanceof HTMLCanvasElement)) {
			return;
		}
		const canvas = canvasNode;

		// Provide a minimal fake 2D context for the JSDOM canvas
		Object.defineProperty(canvas, "getContext", {
			value: (_contextId?: string): Partial<CanvasRenderingContext2D> => ({
				canvas: canvas,
				clearRect: (..._args: unknown[]): void => { void _args; },
				fillRect: (..._args: unknown[]): void => { void _args; },
				fillText: (_text: string, _x: number, _y: number): void => { void _text; void _x; void _y; },
				save: (): void => { /* no-op */ },
				restore: (): void => { /* no-op */ },
			}),
		});

		act(() => {
			api.start(
				canvas,
				(ctx) => {
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
});
