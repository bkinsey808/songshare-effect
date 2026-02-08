import { vi } from "vitest";

/**
 * Test helper that stubs `react-router-dom` with a typed factory and a
 * mocked `useNavigate()` so tests can assert navigation calls. Keeps the
 * necessary TypeScript/ESLint deviations in one place.
 */
export default function mockReactRouterWithNavigate(mockNavigate = vi.fn()): void {
	// Use `doMock` so the mock factory is applied at runtime when the helper is
	// invoked inside the test body rather than being hoisted at module-load time.
	vi.doMock("react-router-dom", async () => {
		const actual = await vi.importActual("react-router-dom");
		return {
			...actual,
			useNavigate: (): typeof mockNavigate => mockNavigate,
			useLocation: (): { pathname: string; search: string; hash: string; state: unknown } => ({
				pathname: "/",
				search: "",
				hash: "",
				state: undefined,
			}),
		};
	});
}
