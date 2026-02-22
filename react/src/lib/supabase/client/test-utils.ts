import type { createClient } from "@supabase/supabase-js";

/* oxlint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion */
import { vi } from "vitest";

import type { SupabaseClientLike } from "./SupabaseClientLike";

// additional helpers shared by multiple supabase client tests

/**
 * Minimal client type used by tests that exercise alpha/beta functionality
 * (e.g. realtime methods).  Placing it here avoids duplication across
 * test-utils modules.
 */
export type FakeClient = SupabaseClientLike & {
	readonly realtime: {
		setAuth: (token: string) => void;
	};
};

/**
 * Factory that returns the minimal fake client.  Properties can be extended by
 * individual tests when necessary; the base implementation only includes the
 * realtime API because that covers the majority of current uses.
 */
export function makeFakeClient(): FakeClient {
	const realtime = { setAuth: vi.fn() };
	return { realtime } as unknown as FakeClient;
}

/**
 * Return a dummy value that matches whatever `createClient` returns. Tests
 * only care about passing an object through the public API and verifying the
 * original factory was called with correct arguments, so the internal shape is
 * irrelevant.
 */
export default function makeFakeSupabaseClient(): ReturnType<typeof createClient> {
	// two-step cast prevents "more narrow than" errors
	const fake = {} as unknown as ReturnType<typeof createClient>;
	return fake;
}
