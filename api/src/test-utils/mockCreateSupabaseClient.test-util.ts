import type { createClient } from "@supabase/supabase-js";

import makeSupabaseClient, { type MakeSupabaseClientOpts } from "./makeSupabaseClient.test-util";

type CreateClientMock = {
	mockReturnValue: (value: ReturnType<typeof createClient>) => unknown;
};

/**
 * Helper to mock createClient with a typed fake client.
 *
 * Wraps the type assertion needed to cast the mock client to the Supabase client type.
 * This isolates unsafe type operations in test helpers rather than test code.
 *
 * @param mockedFn - vi.mocked(createClient)
 * @param opts - Options for the fake client.
 * @returns void
 */
export default function mockCreateSupabaseClient(
	mockedFn: CreateClientMock,
	opts: MakeSupabaseClientOpts = {},
): void {
	const fakeClient = makeSupabaseClient(opts);
	/* oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test helper wraps narrow cast */
	// oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-type-assertion
	mockedFn.mockReturnValue(fakeClient as unknown as ReturnType<typeof createClient>);
}
