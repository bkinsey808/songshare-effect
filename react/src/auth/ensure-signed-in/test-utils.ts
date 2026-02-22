import { vi } from "vitest";

import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

// Helpers that live outside of a `.test.ts` file so we can safely apply
// eslint disables when we perform the unavoidable `as unknown as` casts. The
// lint rule `no-disable-in-tests` prohibits disables inside test files, so
// shared utilities like this are the correct place for them.

// ---------------------------------------------------------------------------
// parseUserSessionData helper
// ---------------------------------------------------------------------------

// Typed helper shape for the `parseUserSessionData` spy used in tests.
export type ParseMock = {
	mockReturnValue: (value: unknown) => void;
	mockImplementation: (...args: unknown[]) => unknown;
};

export function getParseMock(): Promise<ParseMock> {
	// the generic version of spyImport lets us declare the expected shape up
	// front.  no unsafe cast necessary.
	return spyImport<ParseMock>("@/react/auth/parseUserSessionData", "default");
}

// ---------------------------------------------------------------------------
// token cache helper
// ---------------------------------------------------------------------------

// Typed spy shape for `getCachedUserToken` in tests.
export type GetCachedUserTokenSpy = {
	mockReturnValue: (token: string | undefined) => void;
	mockReturnValueOnce?: (token: string | undefined) => void;
	mockResolvedValue?: (token: string | undefined) => void;
};

export function getCachedUserTokenSpy(): Promise<GetCachedUserTokenSpy> {
	return spyImport<GetCachedUserTokenSpy>(
		"@/react/lib/supabase/token/tokenCache",
		"getCachedUserToken",
	);
}

// ---------------------------------------------------------------------------
// client error spy helper
// ---------------------------------------------------------------------------

export type ClientErrorSpy = {
	(...args: unknown[]): unknown;
	mockImplementation?: (...args: unknown[]) => void;
};

export async function spyClientError(): Promise<ClientErrorSpy> {
	const mod = await import("@/react/lib/utils/clientLogger");
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.spyOn(mod, "clientError") as unknown as ClientErrorSpy;
}

// ---------------------------------------------------------------------------
// miscellaneous utilities
// ---------------------------------------------------------------------------

export function restoreFetch(originalFetch: unknown): void {
	Reflect.set(globalThis, "fetch", originalFetch);
}
