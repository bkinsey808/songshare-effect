import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import eventUserAddHandler from "./eventUserAdd";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: "requester-1",
	},
	userPublic: { user_id: "requester-1", username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

/** Helper to patch a fake supabase client so `.from('user').select(...).eq(...).single()` works */
function patchUserSingle(
	client: ReturnType<typeof createClient>,
	resp: { data: unknown; error: unknown },
): ReturnType<typeof createClient> {
	const typed = client;
	const orig = typed.from.bind(typed) as (table: string) => unknown;
	Reflect.set(typed, "from", (table: string): unknown => {
		if (table === "user") {
			return {
				select: (
					_cols: string,
				): {
					eq: (
						_field: string,
						_val: string,
					) => { single: () => Promise<{ data: unknown; error: unknown }> };
				} => ({
					eq: (
						_field: string,
						_val: string,
					): { single: () => Promise<{ data: unknown; error: unknown }> } => ({
						single: async (): Promise<{ data: unknown; error: unknown }> => {
							await Promise.resolve();
							return resp;
						},
					}),
				}),
			} as unknown;
		}
		return orig(table);
	});
	return typed;
}

describe("eventUserAddHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing event_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { user_id: "u-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(/is missing/);
	});

	it("fails when role is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-1", role: "owner" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(/Expected/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("fails when permission check returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectError: { message: "not found" },
		});

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(
			/Event not found or you do not have permission to manage participants/,
		);
	});

	it("rejects when requester is not owner or event admin", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "participant" },
		});

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(
			/Only event owners and event admins can add participants/,
		);
	});

	it("allows event admin to add participants", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1", role: "participant" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_admin" },
			eventUserInsertRows: [{ event_id: "evt-1", user_id: "target-1", role: "participant" }],
		});
		const patched = patchUserSingle(createClient("", ""), {
			data: { user_id: "target-1" },
			error: undefined,
		});
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(eventUserAddHandler(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("fails when target user is not found", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_admin" },
		});
		const patched = patchUserSingle(createClient("", ""), {
			data: undefined,
			error: { message: "not found" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(
			/Target user not found/,
		);
	});

	it("fails when insert returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_admin" },
			eventUserInsertError: { message: "duplicate" },
		});
		const patched = patchUserSingle(createClient("", ""), {
			data: { user_id: "target-1" },
			error: undefined,
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserAddHandler(ctx))).rejects.toThrow(/duplicate/);
	});

	it("inserts event_user and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1", role: "participant" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_admin" },
			eventUserInsertRows: [{ event_id: "evt-1", user_id: "target-1", role: "participant" }],
		});
		const patched2 = patchUserSingle(createClient("", ""), {
			data: { user_id: "target-1" },
			error: undefined,
		});
		vi.mocked(createClient).mockReturnValue(patched2);

		const res = await Effect.runPromise(eventUserAddHandler(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});
});
