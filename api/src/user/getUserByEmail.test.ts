import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import getUserByEmail from "./getUserByEmail";

describe("getUserByEmail (network error handling)", () => {
	it("maps DNS/network-like errors to a friendly DatabaseError message", async () => {
		const dnsErrMsg =
			"kj/async-io-unix.c++:1298: failed: DNS lookup failed.; params.host = gkaizhqpckaaiyjrrjxf.supabase.co; gai_strerror(status) = Name or service not known";

		const { default: makeFakeSupabaseThatRejects } =
			await import("@/api/test-utils/fakeSupabaseClient");
		const fakeSupabase = makeFakeSupabaseThatRejects(dnsErrMsg);

		await expect(
			Effect.runPromise(getUserByEmail({ supabase: fakeSupabase, email: "foo@example.com" })),
		).rejects.toThrow(/Failed to contact Supabase \(network\/DNS error\)/);
	});
});
