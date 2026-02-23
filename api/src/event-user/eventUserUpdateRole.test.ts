import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.mock";

import eventUserUpdateRoleHandler from "./eventUserUpdateRole";

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
		user_id: "owner-1",
	},
	userPublic: { user_id: "owner-1", username: "owner" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

/**
 * Small helper to patch `event_user` behavior so tests can return different
 * rows for the requester vs the target user and control `update` results.
 */
function patchEventUserClient(
	client: ReturnType<typeof createClient>,
	opts: {
		requesterRole?: unknown;
		targetRole?: unknown;
		updateRows?: unknown[] | undefined;
		updateError?: unknown;
	},
): ReturnType<typeof createClient> {
	const typed = client;
	const orig = typed.from.bind(typed) as (table: string) => unknown;
	Reflect.set(typed, "from", (table: string): unknown => {
		if (table === "event_user") {
			return {
				select: (
					_cols: string,
				): {
					eq: (
						_field: string,
						_val: string,
					) => {
						eq: (
							_field2: string,
							_val2: string,
						) => { single: () => Promise<{ data: unknown; error: unknown }> };
					};
				} => ({
					eq: (
						_field: string,
						_val: string,
					): {
						eq: (
							_field2: string,
							_val2: string,
						) => { single: () => Promise<{ data: unknown; error: unknown }> };
					} => ({
						eq: (
							_field2: string,
							val2: string,
						): { single: () => Promise<{ data: unknown; error: unknown }> } => ({
							single: async (): Promise<{ data: unknown; error: unknown }> => {
								await Promise.resolve();
								// if querying for the requester (owner), return requesterRole
								if (val2 === SAMPLE_USER_SESSION.user.user_id) {
									return { data: opts.requesterRole, error: undefined };
								}
								// otherwise return the targetRole (may be undefined to simulate not found)
								return {
									data: opts.targetRole,
									error: opts.targetRole === undefined ? { message: "not found" } : undefined,
								};
							},
						}),
					}),
				}),
				update: (_obj: unknown) => ({
					eq: (
						_field: string,
						_val: string,
					): {
						eq: (
							_field2: string,
							_val2: string,
						) => Promise<{ data: unknown[] | undefined; error: unknown }>;
					} => ({
						eq: async (
							_field2: string,
							_val2: string,
						): Promise<{ data: unknown[] | undefined; error: unknown }> => {
							await Promise.resolve();
							return {
								data: opts.updateRows === undefined ? [] : opts.updateRows,
								error: opts.updateError ?? undefined,
							};
						},
					}),
				}),
			} as unknown;
		}
		return orig(table);
	});
	return typed;
}

describe("eventUserUpdateRoleHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing event_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { user_id: "u-1", role: "event_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(/is missing/);
	});

	it("fails when role is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-2", role: "owner" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(/Expected/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-2", role: "event_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when permission check returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-2", role: "event_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectError: { message: "nope" },
		});

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Event not found or you do not have permission to manage roles/,
		);
	});

	it("rejects when requester is not owner or event admin", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "u-2", role: "event_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "event_playlist_admin" },
		});

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Only event owners and event admins can change participant roles/,
		);
	});

	it("allows event admin to change participant roles", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1", role: "event_playlist_admin" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchEventUserClient(createClient("", ""), {
			requesterRole: { role: "event_admin" },
			targetRole: { role: "participant" },
			updateRows: [{ role: "event_playlist_admin" }],
		});
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(eventUserUpdateRoleHandler(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("fails when target user is not a participant", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1", role: "event_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		// requester is owner, target not found
		const patched = patchEventUserClient(createClient("", ""), {
			requesterRole: { role: "owner" },
			targetRole: undefined,
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/User is not a participant of this event/,
		);
	});

	it("rejects when attempting to change owner's role", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "owner-1", role: "participant" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchEventUserClient(createClient("", ""), {
			requesterRole: { role: "owner" },
			targetRole: { role: "owner" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Cannot change the owner's role/,
		);
	});

	it("fails when update returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1", role: "event_playlist_admin" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchEventUserClient(createClient("", ""), {
			requesterRole: { role: "owner" },
			targetRole: { role: "participant" },
			updateError: { message: "boom" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserUpdateRoleHandler(ctx))).rejects.toThrow(/boom/);
	});

	it("updates role and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1", role: "event_admin" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchEventUserClient(createClient("", ""), {
			requesterRole: { role: "owner" },
			targetRole: { role: "participant" },
			updateRows: [{ role: "event_admin" }],
		});
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(eventUserUpdateRoleHandler(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});
});
