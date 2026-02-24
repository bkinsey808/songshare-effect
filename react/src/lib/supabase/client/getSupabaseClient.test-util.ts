import type { createClient } from "@supabase/supabase-js";

import { expect, vi } from "vitest";

import type { SupabaseClientLike } from "./SupabaseClientLike";

/**
 * Reset mocks and provide a sane default environment.
 *
 * This helper is invoked explicitly in each test to avoid jest-hooks lint
 * rules and to document state per-test.
 */

/** Minimal client type used by tests */
type FakeClient = SupabaseClientLike & {
	readonly realtime: {
		setAuth: (token: string) => void;
	};
};

// mocks are managed locally below

/**
 * Cast a `FakeClient` to the real return type of `createClient`.
 *
 * The assertion is unavoidable due to the minimal shape of our fake, so we
 * centralize the unsafe code here where the test-utils module already disables
 * the relevant lint rules. Consumer tests can stay clean and free of
 * `oxlint-disable` comments.
 */
export function toCreateClientReturn(client: FakeClient): ReturnType<typeof createClient> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return client as unknown as ReturnType<typeof createClient>;
}

/**
 * Build a matcher for the third options argument passed to createClient.
 *
 * The matcher logic lives here to keep `no-unsafe-assignment` disables out of
 * the test file itself; this module already globally disables the rule.
 */
export function createClientOptionsMatcher(token: string): object {
	// oxlint-disable-next-line typescript/no-unsafe-return
	return expect.objectContaining({
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		auth: expect.any(Object),
		// oxlint-disable-next-line typescript/no-unsafe-assignment
		global: expect.objectContaining({
			headers: { Authorization: `Bearer ${token}` },
		}),
	});
}

export function makeFakeClient(): FakeClient {
	const realtime = { setAuth: vi.fn() };
	// return a partial object and assert to satisfy supabase type
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return { realtime } as unknown as FakeClient;
}

export async function setup(): Promise<{
	envMockInternal: ReturnType<typeof vi.fn>;
	cacheMockInternal: ReturnType<typeof vi.fn>;
	guardMockInternal: ReturnType<typeof vi.fn>;
	createClientMockInternal: ReturnType<typeof vi.fn>;
	globalCache: Map<string, FakeClient>;
}> {
	vi.resetModules();
	vi.doMock("@/react/lib/utils/env");
	vi.doMock("./getGlobalClientCache");
	vi.doMock("./guards/guardAsSupabaseClientLike");
	vi.doMock("@supabase/supabase-js");
	vi.resetAllMocks();

	// internal mock references; assigned by setup()
	// oxlint-disable-next-line init-declarations
	let envMockInternal: ReturnType<typeof vi.fn>;
	// oxlint-disable-next-line init-declarations
	let cacheMockInternal: ReturnType<typeof vi.fn>;
	// oxlint-disable-next-line init-declarations
	let guardMockInternal: ReturnType<typeof vi.fn>;
	// oxlint-disable-next-line init-declarations
	let createClientMockInternal: ReturnType<typeof vi.fn>;

	const { getEnvValueSafe } = await import("@/react/lib/utils/env");
	const { default: _cache } = await import("./getGlobalClientCache");
	const { default: _guard } = await import("./guards/guardAsSupabaseClientLike");
	const { createClient: _createClient } = await import("@supabase/supabase-js");

	envMockInternal = vi.mocked(getEnvValueSafe);
	cacheMockInternal = vi.mocked(_cache);
	guardMockInternal = vi.mocked(_guard);
	createClientMockInternal = vi.mocked(_createClient);

	// cache shared across tests
	const globalCache = new Map<string, FakeClient>();

	envMockInternal.mockImplementation((key: string) => {
		if (key === "SUPABASE_URL") {
			return "https://example.supabase.co";
		}
		if (key === "SUPABASE_ANON_KEY") {
			return "anon-key";
		}
		return undefined;
	});
	globalCache.clear();
	/*
		   cacheMockInternal returns a Map full of fake clients; the cast is
		   intentionally loose and already lives in a helper file.  Move the
		   assertion onto its own variable so the `oxlint-disable` can sit on the
		   line that actually triggers the rule.
		*/
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const looseCache: unknown = globalCache;
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	cacheMockInternal.mockReturnValue(looseCache as Map<string, ReturnType<typeof createClient>>);
	// oxlint-disable-next-line @typescript-eslint/no-explicit-any, id-length, @typescript-eslint/no-unsafe-return
	guardMockInternal.mockImplementation((client: any) => client);
	// the fake client is typed `any` internally; put the cast on the variable so
	// the linter comment can disable it directly
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	const looseCreate = makeFakeClient() as unknown as ReturnType<typeof createClient>;
	createClientMockInternal.mockImplementation(() => looseCreate);

	return {
		envMockInternal,
		cacheMockInternal,
		guardMockInternal,
		createClientMockInternal,
		globalCache,
	};
}
