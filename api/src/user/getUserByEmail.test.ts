import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";

import getUserByEmail from "./getUserByEmail";

describe("getUserByEmail (network error handling)", () => {
	it("maps DNS/network-like errors to a friendly DatabaseError message", async () => {
		const dnsErrMsg =
			"kj/async-io-unix.c++:1298: failed: DNS lookup failed.; params.host = gkaizhqpckaaiyjrrjxf.supabase.co; gai_strerror(status) = Name or service not known";

		const fakeSupabase = makeSupabaseClient({ userMaybeReject: dnsErrMsg });

		await expect(
			Effect.runPromise(getUserByEmail({ supabase: fakeSupabase, email: "foo@example.com" })),
		).rejects.toThrow(/Failed to contact Supabase \(network\/DNS error\)/);
	});
});

describe("getUserByEmail (core behavior)", () => {
	it("returns undefined when no row is found", async () => {
		const supabase = makeSupabaseClient();

		const res = await Effect.runPromise(getUserByEmail({ supabase, email: "noone@example.com" }));
		expect(res).toBeUndefined();
	});

	it("returns undefined when PostgREST reports table-not-exists (PGRST205)", async () => {
		const supabase = makeSupabaseClient({
			userMaybeError: { code: "PGRST205", message: "table missing" },
		});

		const res = await Effect.runPromise(getUserByEmail({ supabase, email: "x@example.com" }));
		expect(res).toBeUndefined();
	});

	it("maps PostgREST errors (non-PGRST205) to DatabaseError", async () => {
		const supabase = makeSupabaseClient({ userMaybeError: { message: "boom" } });

		await expect(
			Effect.runPromise(getUserByEmail({ supabase, email: "err@example.com" })),
		).rejects.toThrow(/boom/);
	});

	it("returns validated user and normalizes nulls + linked_providers -> []", async () => {
		const sampleUser = {
			created_at: "2026-01-01T00:00:00Z",
			email: "u@example.com",
			google_calendar_access: "none",
			google_calendar_refresh_token: undefined,
			linked_providers: undefined,
			name: "Name",
			role: "user",
			role_expires_at: undefined,
			sub: undefined,
			updated_at: "2026-01-01T00:00:00Z",
			user_id: "00000000-0000-4000-8000-000000000001",
		};

		const supabase = makeSupabaseClient({ userMaybe: sampleUser });

		const res = await Effect.runPromise(getUserByEmail({ supabase, email: sampleUser.email }));
		expect(res).toBeDefined();
		expect(res?.linked_providers).toStrictEqual([]);
	});

	it("falls back to [] when normalizeLinkedProviders throws", async () => {
		const sampleUser = {
			created_at: "2026-01-01T00:00:00Z",
			email: "u2@example.com",
			google_calendar_access: "none",
			google_calendar_refresh_token: undefined,
			linked_providers: ["google"],
			name: "Name",
			role: "user",
			role_expires_at: undefined,
			sub: undefined,
			updated_at: "2026-01-01T00:00:00Z",
			user_id: "00000000-0000-4000-8000-000000000002",
		};

		const supabase = makeSupabaseClient({ userMaybe: sampleUser });

		const mod = await import("@/api/provider/normalizeLinkedProviders");
		vi.spyOn(mod, "default").mockImplementation(() => {
			throw new Error("bad");
		});

		const res = await Effect.runPromise(getUserByEmail({ supabase, email: sampleUser.email }));
		expect(res).toBeDefined();
		expect(res?.linked_providers).toStrictEqual([]);
	});

	it("maps validation failures to DatabaseError", async () => {
		const supabase = makeSupabaseClient({
			userMaybe: { user_id: "not-a-uuid", email: "no", name: undefined },
		});

		let thrown: unknown = undefined;
		try {
			await Effect.runPromise(getUserByEmail({ supabase, email: "bad@example.com" }));
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeTruthy();
		expect(String(thrown)).toMatch(
			/Expected a Universally Unique Identifier|Expected string|validation|created_at/i,
		);
	});
});
