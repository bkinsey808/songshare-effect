import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import type { ReadonlySupabaseClient } from "@/api/supabase/supabase-client";

import getUserByEmail from "./getUserByEmail";

describe("getUserByEmail (network error handling)", () => {
	it("maps DNS/network-like errors to a friendly DatabaseError message", async () => {
		const dnsErrMsg =
			"kj/async-io-unix.c++:1298: failed: DNS lookup failed.; params.host = gkaizhqpckaaiyjrrjxf.supabase.co; gai_strerror(status) = Name or service not known";

		/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment */
		// Fake Supabase client that rejects with a DNS-like error
		const fakeSupabase = {
			from(): {
				select(): {
					eq(): {
						maybeSingle(): Promise<never>;
					};
				};
			} {
				return {
					select() {
						return {
							eq() {
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		} as unknown as ReadonlySupabaseClient;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		await expect(
			Effect.runPromise(getUserByEmail({ supabase: fakeSupabase, email: "foo@example.com" })),
		).rejects.toMatchObject({
			message: expect.stringContaining("Failed to contact Supabase (network/DNS error)"),
		}); /* eslint-enable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment */
	});
});
