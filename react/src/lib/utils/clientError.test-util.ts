import { vi } from "vitest";

// Helpers that live outside of a `.test.ts` file so we can safely apply
// eslint disables when we perform the unavoidable `as unknown as` casts. The
// lint rule `no-disable-in-tests` prohibits disables inside test files, so
// shared utilities like this are the correct place for them.

// parseUserSessionData is a pure validator and is imported directly in tests; no helper mock is required.

// ---------------------------------------------------------------------------
// client error spy helper
// ---------------------------------------------------------------------------

type ClientErrorSpy = {
	(...args: unknown[]): unknown;
	mockImplementation?: (...args: unknown[]) => void;
};

/**
 * Create a spy for the client error logger by dynamically importing the module
 * and returning the vitest spy. Useful in tests that assert on error logging.
 *
 * @returns Promise<ClientErrorSpy> - vitest spy that wraps `clientError`
 */
// oxlint-disable-next-line eslint/prefer-default-export -- single helper file keeps imports tidy
export async function spyClientError(): Promise<ClientErrorSpy> {
	const mod = await import("@/react/lib/utils/clientLogger");
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.spyOn(mod, "clientError") as unknown as ClientErrorSpy;
}
