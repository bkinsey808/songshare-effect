import { vi } from "vitest";

/**
 * mockReactRouterWithNavigate
 *
 * Test helper that stubs `react-router-dom` with a typed factory and a
 * mocked `useNavigate()` so tests can assert navigation calls. Keeps the
 * necessary TypeScript/ESLint deviations in one place.
 */
export default function mockReactRouterWithNavigate(): void {
	// Use `doMock` so the mock factory is applied at runtime when the helper is
	// invoked inside the test body rather than being hoisted at module-load time.
	vi.doMock("react-router-dom", async () => {
		const actual = await import("react-router-dom");
		return { ...actual, useNavigate: vi.fn() };
	});
}
