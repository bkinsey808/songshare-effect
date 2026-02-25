import { describe, expect, it } from "vitest";

import makeSupabaseClient from "./makeSupabaseClient.test-util";

describe("makeSupabaseClient - userMaybeReject", () => {
	it("rejects the user select Promise when given a string message", async () => {
		const msg = "simulated DNS failure";
		const supabase = makeSupabaseClient({ userMaybeReject: msg });

		await expect(
			supabase.from("user").select("user_id").eq("user_id", "u").maybeSingle(),
		).rejects.toThrow(msg);
	});

	it("throws the provided Error instance when userMaybeReject is an Error", async () => {
		const err = new Error("boom");
		const supabase = makeSupabaseClient({ userMaybeReject: err });

		await expect(
			supabase.from("user").select("user_id").eq("user_id", "u").maybeSingle(),
		).rejects.toThrow(err);
	});
});
