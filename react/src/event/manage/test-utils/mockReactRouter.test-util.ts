import { vi } from "vitest";

/**
 * Mocks React Router for event-manage tests.
 *
 * The event-manage hooks rely on React Router for params/navigation. In tests
 * we usually stub the router once rather than repeating the mock in every
 * spec. To make that explicit, tests can call this helper directly.
 *
 * Uses `doMock` so the call is not hoisted; that way consumers can call this
 * helper at runtime if they want to re-mock differently per-test.
 */
export default function mockReactRouter(): void {
	vi.doMock("react-router-dom", async () => {
		const actual = await vi.importActual("react-router-dom");
		// real `useNavigate` returns a function; our stub should mimic that by
		// returning a *factory* which itself returns a jest mock. this allows
		// callers to invoke the hook inside renderHook and then call the
		// resulting navigate function without crashing.
		const navigateMock = vi.fn();
		return {
			...actual,
			useParams: (): { event_slug: string } => ({ event_slug: "e1" }),
			// oxlint-disable-next-line typescript/explicit-function-return-type
			useNavigate: () => navigateMock,
		};
	});
}
