import type { ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";

/**
 * Create a fake Supabase client that rejects promises with the given DNS error message.
 *
 * This is a **test helper** that intentionally returns a partial, minimal client
 * shape used by the code under test. The helper centralizes the single narrow
 * unsafe assertion so individual tests don't need inline `eslint-disable`
 * comments scattered across the codebase.
 *
 * @param dnsErrMsg - Error message that will be used when the fake client rejects
 * @returns A `ReadonlySupabaseClient`-shaped fake useful for testing failure paths
 */
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

	// Localized cast: return the partial as the test-shaped `ReadonlySupabaseClient`.
	// This single, documented cast keeps the tests readable and avoids repeated
	// inline disables throughout test files.
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment -- test-only narrow cast to ReadonlySupabaseClient */
	return fakeSupabase as ReadonlySupabaseClient;
}
