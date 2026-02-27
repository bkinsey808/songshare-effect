import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import communityUserUpdateRoleHandler from "./communityUserUpdateRole";

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
 * Helper to shim `community_user` table behaviour for tests.
 */
function patchCommunityUserClient(
	client: ReturnType<typeof createClient>,
	opts: {
		requesterRole?: unknown;
		selectError?: unknown;
		updateRows?: unknown[] | undefined;
		updateError?: unknown;
	},
): ReturnType<typeof createClient> {
	const typed = client;
	const orig = typed.from.bind(typed) as (table: string) => unknown;
	Reflect.set(typed, "from", (table: string): unknown => {
		if (table === "community_user") {
			return {
				select: (_cols: string): unknown => ({
					eq: (_field: string, _val: string): unknown => ({
						eq: (_field2: string, _val2: string): unknown => ({
							single: async (): Promise<{ data: unknown; error: unknown }> => {
								await Promise.resolve();
								if (opts.selectError !== undefined && opts.selectError !== null) {
									return { data: undefined, error: opts.selectError };
								}
								return { data: opts.requesterRole, error: undefined };
							},
						}),
					}),
				}),
				update: (_obj: unknown): unknown => ({
					eq: (_field: string, _val: string): unknown => ({
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

/* -------------------------------------------------------------------------- */
describe("communityUserUpdateRoleHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request body is missing fields", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { community_id: "c1", user_id: "u1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Invalid request body/,
		);
	});

	it("fails when role is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { community_id: "c1", user_id: "u1", role: "owner" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Invalid request body/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { community_id: "c1", user_id: "u1", role: "member" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when permission check returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { community_id: "c1", user_id: "u1", role: "member" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchCommunityUserClient(createClient("", ""), {
			selectError: { message: "nope" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Community not found or you do not have permission to manage roles/,
		);
	});

	it("rejects when requester is not owner or admin", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { community_id: "c1", user_id: "u1", role: "member" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchCommunityUserClient(createClient("", ""), {
			requesterRole: { role: "member" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(
			/Only community owners and admins can manage roles/,
		);
	});

	it("fails when update returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { community_id: "c1", user_id: "u1", role: "community_admin" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchCommunityUserClient(createClient("", ""), {
			requesterRole: { role: "owner" },
			updateError: { message: "boom" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(communityUserUpdateRoleHandler(ctx))).rejects.toThrow(/boom/);
	});

	it("updates role and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { community_id: "c1", user_id: "target-1", role: "member" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient));
		const patched = patchCommunityUserClient(createClient("", ""), {
			requesterRole: { role: "community_admin" },
			updateRows: [{ role: "member" }],
		});
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(communityUserUpdateRoleHandler(ctx));
		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});
});
