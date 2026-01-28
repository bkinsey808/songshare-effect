import { vi } from "vitest";

declare global {
	var __TYPEGPU_CALLED: boolean | undefined;
}

function typegpuFactory(): { default: Record<string, unknown> } {
	return { default: {} };
}

/**
 * Apply the TypeGPU-related mocks at runtime.
 * Call this inside a test before importing modules that depend on `runTypeGpuDemo`.
 * Returns the mocked `runTypeGpuDemo` function so tests can assert invocations.
 */
export function mockTypeGpu(): { runTypeGpuDemoMock: ReturnType<typeof vi.fn> } {
	// Minimal mock for the `typegpu` runtime (tests don't need the real impl)
	vi.doMock("typegpu", typegpuFactory);

	// Provide a mock `runTypeGpuDemo` that signals globally when invoked so tests
	// can assert the integration path without running WebGPU code.
	const fn = vi.fn((): (() => void) => {
		/* istanbul ignore next */
		globalThis.__TYPEGPU_CALLED = true;
		return (): void => {
			/* stop */
		};
	});
	// Type the mock factory to satisfy linting rules
	vi.doMock("@/react/typegpu/runTypeGpuDemo", () => ({ default: fn }) as { default: typeof fn });
	return { runTypeGpuDemoMock: fn };
}

export function mockTypeGpuWithoutInit(): void {
	vi.doMock("typegpu", () => ({ unknown: 123 }));
}
