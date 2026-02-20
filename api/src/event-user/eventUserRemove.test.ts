import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/test-utils/makeCtx.mock";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.mock";

import eventUserRemoveHandler from "./eventUserRemove";

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

/**
 * Patch a fake supabase client so `from('event_user').select(...).eq(...).single()`
 * returns per-user responses based on the `user_id` value passed to `eq`.
 */
function patchEventUserSelect(
	client: ReturnType<typeof createClient>,
	responses: Record<string, { data: unknown; error: unknown }>,
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
							_val2: string,
						): { single: () => Promise<{ data: unknown; error: unknown }> } => ({
							single: async (): Promise<{ data: unknown; error: unknown }> => {
								await Promise.resolve();
								return responses[_val2] ?? { data: undefined, error: { message: "not found" } };
							},
						}),
					}),
				}),
				delete: () => ({
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
							return { data: [], error: undefined };
						},
					}),
				}),
			} as unknown;
		}
		return orig(table);
	});
	return typed;
}

/** Patch event_user.delete to return the provided deleteResult */
function patchEventUserDelete(
	client: ReturnType<typeof createClient>,
	deleteResult: { data: unknown[] | undefined; error: unknown },
	selectResponses?: Record<string, { data: unknown; error: unknown }>,
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
							_val2: string,
						): { single: () => Promise<{ data: unknown; error: unknown }> } => ({
							single: async (): Promise<{ data: unknown; error: unknown }> => {
								await Promise.resolve();
								return (
									selectResponses?.[_val2] ?? { data: undefined, error: { message: "not found" } }
								);
							},
						}),
					}),
				}),
				delete: () => ({
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
							return deleteResult;
						},
					}),
				}),
			} as unknown;
		}
		return orig(table);
	});
	return typed;
}

describe("eventUserRemoveHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing event_id or user_id", async () => {
		vi.resetAllMocks();
		const ctxA = makeCtx({ body: { user_id: "u-1" } });
		const ctxB = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctxA))).rejects.toThrow(/is missing/);
		await expect(Effect.runPromise(eventUserRemoveHandler(ctxB))).rejects.toThrow(/is missing/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when permission verification returns an error for non-self removal", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectError: { message: "no row" },
		});

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/Event not found or you do not have permission to manage participants/,
		);
	});

	it("rejects when requester is not owner or event admin", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventUserSelectRow: { role: "participant" },
		});

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/Only event owners and event admins can remove other participants/,
		);
	});

	it("fails when target user is not a participant", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {});
		const patched = patchEventUserSelect(createClient("", ""), {
			"requester-1": { data: { role: "owner" }, error: undefined },
			"target-1": { data: undefined, error: { message: "not found" } },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/User is not a participant of this event/,
		);
	});

	it("prevents removing the event owner", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "owner-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {});
		const patched = patchEventUserSelect(createClient("", ""), {
			"requester-1": { data: { role: "owner" }, error: undefined },
			"owner-1": { data: { role: "owner" }, error: undefined },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(
			/Cannot remove the event owner/,
		);
	});

	it("fails when delete returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1", user_id: "target-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {});
		const patchedWithDelete = patchEventUserDelete(
			createClient("", ""),
			{ data: undefined, error: { message: "delete-failed" } },
			{
				"requester-1": { data: { role: "owner" }, error: undefined },
				"target-1": { data: { role: "participant" }, error: undefined },
			},
		);
		vi.mocked(createClient).mockReturnValue(patchedWithDelete);

		await expect(Effect.runPromise(eventUserRemoveHandler(ctx))).rejects.toThrow(/delete-failed/);
	});

	it("removes participant and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1", user_id: "target-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {});
		const patched = patchEventUserSelect(createClient("", ""), {
			"requester-1": { data: { role: "owner" }, error: undefined },
			"target-1": { data: { role: "participant" }, error: undefined },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(eventUserRemoveHandler(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});
});
