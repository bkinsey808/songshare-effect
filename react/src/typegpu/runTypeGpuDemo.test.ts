import { describe, expect, it, vi } from "vitest";

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
		/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
		vi.spyOn(canvas, "getContext").mockReturnValue(mockContext as unknown as GPUCanvasContext);
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
			/* oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
			typegpuModule: mockModule as never,
		});

		expect(typeof stop).toBe("function");
		expect(canvas.dataset["typegpu"]).toBe("active");
		expect(mockContext.configure).toHaveBeenCalledWith(expect.any(Object));

		stop();
		expect(destroyCalled.val).toBe(true);
		expect(canvas.dataset["typegpu"]).toBeUndefined();
		cleanup();
	});

	it("throws when typegpu lacks init function", async () => {
		const cleanup = setup();
		/* eslint-disable-next-line jest/no-untyped-mock-factory */
		vi.doMock("typegpu", () => ({ unknown: 123 }));
		const { default: runTypeGpuDemo } = await import("./runTypeGpuDemo");

		const canvas = makeCanvas();
		const SHORT_DURATION = 10;
		await expect(runTypeGpuDemo(canvas, SHORT_DURATION)).rejects.toBeInstanceOf(Error);
		cleanup();
	});
});
