// Helper to stub `getSupabaseServerClient` in tests without repeating unsafe
// type assertions in each test file.
import { vi } from "vitest";

export default async function stubGetSupabaseServerClient(mock: unknown): Promise<void> {
	const supabaseModule = await import("@/api/supabase/getSupabaseServerClient");
	// Use a single local, documented assertion in the helper so tests remain
	// free of repeated eslint-disable comments.
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-argument -- test helper central cast: spy return is untyped */
	vi.spyOn(supabaseModule, "default").mockReturnValue(mock as any);
}
