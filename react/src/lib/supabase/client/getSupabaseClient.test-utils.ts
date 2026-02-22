import { createClient } from "@supabase/supabase-js";
import { vi, expect, type MockedFunction } from "vitest";

import { getEnvValueSafe } from "@/react/lib/utils/env";

import type { SupabaseClientLike } from "./SupabaseClientLike";

import getGlobalClientCache from "./getGlobalClientCache";
import guardAsSupabaseClientLike from "./guards/guardAsSupabaseClientLike";

/* oxlint-disable @typescript-eslint/no-unsafe-call,
   @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unsafe-return,
   @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-type-assertion,
   @typescript-eslint/no-magic-numbers,
   no-disable-in-tests/no-disable-in-tests,
   import/exports-last */

// helpers ------------------------------------------------------------------

/** Minimal client type used by tests */
export type FakeClient = SupabaseClientLike & {
	readonly realtime: {
		setAuth: (token: string) => void;
	};
};

export function makeFakeClient(): FakeClient {
	const realtime = { setAuth: vi.fn() };
	// return a partial object and assert to satisfy supabase type
	return { realtime } as unknown as FakeClient;
}

// mocks --------------------------------------------------------------------
vi.mock("@/react/lib/utils/env");
vi.mock("./getGlobalClientCache");
vi.mock("./guards/guardAsSupabaseClientLike");
vi.mock("@supabase/supabase-js");

export const envMock: MockedFunction<typeof getEnvValueSafe> = vi.mocked(getEnvValueSafe);
export const cacheMock: MockedFunction<typeof getGlobalClientCache> =
	vi.mocked(getGlobalClientCache);
export const guardMock: MockedFunction<typeof guardAsSupabaseClientLike> =
	vi.mocked(guardAsSupabaseClientLike);
export const createClientMock: MockedFunction<typeof createClient> = vi.mocked(createClient);

// timing constants used in tests
export const MS_IN_MINUTE = 60_000;
export const MINUTES_PER_HOUR = 60;
export const EVICTION_BUFFER_MINUTES = 2;

export const HOUR_MS = MINUTES_PER_HOUR * MS_IN_MINUTE;
export const TWO_MINUTES_MS = EVICTION_BUFFER_MINUTES * MS_IN_MINUTE;

// cache shared across tests
export const globalCache = new Map<string, FakeClient>();

/**
 * Cast a `FakeClient` to the real return type of `createClient`.
 *
 * The assertion is unavoidable due to the minimal shape of our fake, so we
 * centralize the unsafe code here where the test-utils module already disables
 * the relevant lint rules. Consumer tests can stay clean and free of
 * `oxlint-disable` comments.
 */
export function toCreateClientReturn(client: FakeClient): ReturnType<typeof createClient> {
	return client as unknown as ReturnType<typeof createClient>;
}

/**
 * Reset mocks and provide a sane default environment.
 *
 * This helper is invoked explicitly in each test to avoid jest-hooks lint
 * rules and to document state per-test.
 */
export function setup(): void {
	// clear module cache to ensure mocks apply to freshly imported modules
	vi.resetModules();
	vi.resetAllMocks();

	// ensure env returns defined values by default
	envMock.mockImplementation((key: string) => {
		if (key === "SUPABASE_URL") {
			return "https://example.supabase.co";
		}
		if (key === "SUPABASE_ANON_KEY") {
			return "anon-key";
		}
		return undefined;
	});

	// provide a shared cache for tests that need caching behavior
	globalCache.clear();
	// cast to match supabase client map
	cacheMock.mockReturnValue(globalCache as unknown as Map<string, ReturnType<typeof createClient>>);

	// guard just returns its input
	// oxlint-disable-next-line @typescript-eslint/no-explicit-any
	guardMock.mockImplementation((client: any) => client);

	// createClient returns a new fake client each time
	// ensure return type aligns with actual supabase client
	createClientMock.mockImplementation(
		() => makeFakeClient() as unknown as ReturnType<typeof createClient>,
	);
}
/**
 * Build a matcher for the third options argument passed to createClient.
 *
 * The matcher logic lives here to keep `no-unsafe-assignment` disables out of
 * the test file itself; this module already globally disables the rule.
 */
export function createClientOptionsMatcher(token: string): object {
	return expect.objectContaining({
		auth: expect.any(Object),
		global: expect.objectContaining({
			headers: { Authorization: `Bearer ${token}` },
		}),
	});
}
