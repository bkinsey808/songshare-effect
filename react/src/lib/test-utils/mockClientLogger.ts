import { vi } from "vitest";

/**
 * Helper for mocking the client logger; tests should call this early before
 * importing anything that uses `clientDebug`. Use this to grab the mocked
 * function without importing the real module yourself.
 */
export default function mockClientLogger(): void {
	// use doMock so the call isn't hoisted by vitest; it should run when the
	// helper is invoked rather than at module evaluation time.
	vi.doMock("@/react/lib/utils/clientLogger", () => ({ clientDebug: vi.fn() }));
}
