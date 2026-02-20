import type { createClient } from "@supabase/supabase-js";

import makeSupabaseClient, { type MakeSupabaseClientOpts } from "./makeSupabaseClient.mock";

/**
 * Helper to mock createClient with a typed fake client.
 *
 * Wraps the type assertion needed to cast the mock client to the Supabase client type.
 * This isolates unsafe type operations in test helpers rather than test code.
 *
 * @param mockedFn - vi.mocked(createClient)
 * @param opts - Options for the fake client
 */
/* oxlint-disable typescript-eslint/no-explicit-any, typescript-eslint/explicit-module-boundary-types */
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
export default function mockCreateSupabaseClient(
	mockedFn: any,
	opts: MakeSupabaseClientOpts = {},
): void {
	/* oxlint-enable typescript-eslint/no-explicit-any, typescript-eslint/explicit-module-boundary-types */
	const fakeClient = makeSupabaseClient(opts);
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test helper wraps narrow cast */
	// oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-type-assertion
	mockedFn.mockReturnValue(fakeClient as unknown as ReturnType<typeof createClient>);
}
