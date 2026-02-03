import type { ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";

export default function makeFakeSupabaseThatRejects(dnsErrMsg: string): ReadonlySupabaseClient {
	// Create a typed, empty partial and assign members below so we can keep
	// the unsafe assertions localized and documented.
	const fakeSupabase: Partial<ReadonlySupabaseClient> = {};

	// Narrowly-scoped partial assignment for the `from` helper used in tests.
	// Define the readonly `from` property using `Object.defineProperty` to avoid
	// mutating the object directly. Keep the unsafe assertion localized here.
	/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion -- test-only partial assignment */
	Object.defineProperty(fakeSupabase, "from", {
		value: function from(): { select(): { eq(): { maybeSingle(): Promise<never> } } } {
			return {
				select(): { eq(): { maybeSingle(): Promise<never> } } {
					return {
						eq(): { maybeSingle(): Promise<never> } {
							return {
								maybeSingle(): Promise<never> {
									return Promise.reject(new Error(dnsErrMsg));
								},
							};
						},
					};
				},
			};
		},
	});
	/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion */

	// Narrowly-scoped cast to `ReadonlySupabaseClient` for test helper
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only narrow cast to ReadonlySupabaseClient
	return fakeSupabase as ReadonlySupabaseClient;
}
