import { vi } from "vitest";

const mockState = vi.hoisted(() => ({
	mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
}));

/**
 * Sets up mocking for the slide-manager hook in tests.
 *
 * Must be called before rendering/importing any code that uses
 * `useSlideManagerView`. Returns the mock function for direct access if needed.
 *
 * No module-level side effects—only mocks when explicitly called.
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
	// Clear module cache to ensure vi.doMock() takes effect
	vi.resetModules();

	mockState.mockFn = vi.fn();

	// oxlint-disable-next-line jest/no-untyped-mock-factory -- we always provide the correct return type later
	vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
		default: mockState.mockFn,
	}));

	return mockState.mockFn;
}

export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
	// Return the stored mock function (set up by mockUseSlideManagerView())
	return mockState.mockFn;
}
