import { describe, expect, it, vi } from "vitest";

import asNever from "@/react/lib/test-utils/asNever";

import asGpuCanvasContext from "./asGpuCanvasContext.mock";

function makeCanvas(): HTMLCanvasElement {
	const canvasEl = document.createElement("canvas");
	canvasEl.width = 100;
	canvasEl.height = 100;
	return canvasEl;
}

describe("runTypeGpuDemo", () => {
	function setup(): () => void {
		vi.resetModules();
		return () => {
			vi.unstubAllGlobals();
		};
	}

	it("calls init and creates a WebGPU animation demo", async () => {
		const cleanup = setup();
		// Mock TypeGPU for idiomatic pipeline API
		const destroyCalled = { val: false };
		const mockDevice = {};

		const mockContext = {
			configure: vi.fn(),
			getCurrentTexture: vi.fn(() => ({
				createView: vi.fn(() => ({})),
			})),
		};

		const mockUniform = {
			write: vi.fn(),
			$: 0,
		};

		const mockExecution = {
			with: vi.fn(() => mockExecution),
			withColorAttachment: vi.fn(() => mockExecution),
			draw: vi.fn(),
		};

		const mockPipeline = {
			with: vi.fn(() => mockExecution),
		};

		// Mock vertex and fragment functions
		// vertexFn/fragmentFn return a function that can be called with template strings or functions
		// That function then returns an object with $uses method
		const mockVertexFnResult = {
			$uses: vi.fn(function mockVertexFnUses() {
				return mockVertexFnResult;
			}),
		};

		const mockFragmentFnResult = {
			$uses: vi.fn(function mockFragmentFnUses() {
				return mockFragmentFnResult;
			}),
		};

		const mockRoot = {
			device: mockDevice,
			destroy: (): void => {
				destroyCalled.val = true;
			},
			createUniform: vi.fn(() => mockUniform),
			"~unstable": {
				// vertexFn() returns a function that accepts template strings/functions
				vertexFn: vi.fn(() => vi.fn(() => mockVertexFnResult)),
				fragmentFn: vi.fn(() => vi.fn(() => mockFragmentFnResult)),
				withVertex: vi.fn(() => ({
					withFragment: vi.fn(() => ({
						createPipeline: vi.fn(() => mockPipeline),
					})),
				})),
			},
		};

		const mockModule = {
			init(): Promise<typeof mockRoot> {
				return Promise.resolve(mockRoot);
			},
			fn: vi.fn(() => vi.fn()),
			"~unstable": {
				vertexFn: vi.fn(() => vi.fn(() => mockVertexFnResult)),
				fragmentFn: vi.fn(() => vi.fn(() => mockFragmentFnResult)),
			},
		};

		const { default: runTypeGpuDemo } = await import("./runTypeGpuDemo");

		const canvas = makeCanvas();
		// Mock getContext to return our mock WebGPU context
		vi.spyOn(canvas, "getContext").mockReturnValue(asGpuCanvasContext(mockContext));
		// Mock navigator.gpu
		const originalNavigator = globalThis.navigator;
		vi.stubGlobal("navigator", {
			userAgent: originalNavigator.userAgent,
			gpu: {
				getPreferredCanvasFormat: () => "bgra8unorm",
			},
		});

		// Mock GPUTextureUsage
		vi.stubGlobal("GPUTextureUsage", {
			RENDER_ATTACHMENT: 16,
		});

		const STOP_DURATION = 100;
		const stop = await runTypeGpuDemo(canvas, STOP_DURATION, {
			onFinish: () => undefined,
			typegpuModule: asNever(mockModule),
		});

		expect(canvas.dataset["typegpu"]).toBe("active");
		expect(mockContext.configure).toHaveBeenCalledWith(expect.any(Object));

		stop();
		expect(destroyCalled.val).toBe(true);
		expect(canvas.dataset["typegpu"]).toBeUndefined();
		cleanup();
	});

	it("throws when typegpu lacks init function", async () => {
		const cleanup = setup();
		const { default: runTypeGpuDemo } = await import("./runTypeGpuDemo");
		expect(typeof runTypeGpuDemo).toBe("function");

		const canvas = makeCanvas();
		const SHORT_DURATION = 10;
		let caughtError: unknown = undefined;
		try {
			// Use a centralized test helper to produce a malformed TypeGPU module shape.
			const malformed = await import("@/react/lib/typegpu/makeMalformedTypegpuModule.mock");
			await runTypeGpuDemo(canvas, SHORT_DURATION, { typegpuModule: malformed.default() });
		} catch (error) {
			caughtError = error;
		}
		expect(caughtError).toBeInstanceOf(Error);
		cleanup();
	});
});
