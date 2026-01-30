import { vi } from "vitest";

import type getSupabaseClient from "@/react/supabase/client/getSupabaseClient";

/**
 * Create a minimal `SupabaseClientLike` used in tests.
 *
 * The client implements enough of the Supabase client surface to allow
 * queries and realtime subscription helpers to run synchronously without
 * performing network requests. Methods are stubbed with `vi.fn()` and resolve
 * with empty data by default.
 *
 * @returns A value matching `ReturnType<typeof getSupabaseClient>` suitable for unit tests.
 */
export default function createMinimalSupabaseClient(): ReturnType<typeof getSupabaseClient> {
	return {
		from: (_table: string) => ({
			select: vi.fn().mockResolvedValue({ data: [], error: undefined }),
		}),
		channel: () => ({ on: vi.fn(), subscribe: vi.fn() }),
		removeChannel: () => undefined,
		auth: { getUser: vi.fn().mockResolvedValue({ data: {}, error: undefined }) },
	};
}
