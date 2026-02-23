import { vi } from "vitest";

// This helper lives next to the token-cache implementation so tests can
// easily import it. We use a static relative import so Vitest's bundler can
// analyse the dependency and allow mocks to apply. No generic `spyImport`
// helper is needed here.

// Typed spy shape for `getCachedUserToken` in tests. Exported so callers
// can reference the type and avoid unsafe `any` warnings.
export type GetCachedUserTokenSpy = {
	mockReturnValue: (token: string | undefined) => void;
	mockReturnValueOnce?: (token: string | undefined) => void;
	mockResolvedValue?: (token: string | undefined) => void;
};

export async function getCachedUserTokenSpy(): Promise<GetCachedUserTokenSpy> {
	const mod = await import("./token-cache");
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.spyOn(mod, "getCachedUserToken") as unknown as GetCachedUserTokenSpy;
}
