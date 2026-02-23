import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import buildClearCookieHeader from "@/api/cookie/buildClearCookieHeader";
import verifyDoubleSubmitOrThrow from "@/api/csrf/verifyDoubleSubmitOrThrow";
import verifySameOriginOrThrow from "@/api/csrf/verifySameOriginOrThrow";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.mock";
import { HTTP_FORBIDDEN } from "@/shared/constants/http";

import accountDelete from "./accountDelete";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/buildClearCookieHeader");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/csrf/verifySameOriginOrThrow");
vi.mock("@/api/csrf/verifyDoubleSubmitOrThrow");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";

describe("accountDelete", () => {
	it("deletes user, clears cookie and returns success (happy path)", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
			resHeadersAppend: appendSpy,
		});

		vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
		vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>({
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
					user_id: SAMPLE_USER_ID,
				},
				userPublic: { user_id: SAMPLE_USER_ID, username: "testuser" },
				oauthUserData: { email: "u@example.com" },
				oauthState: { csrf: "x", lang: "en", provider: "google" },
				ip: "127.0.0.1",
			}),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			userDeleteRows: [{ user_id: SAMPLE_USER_ID }],
		});
		vi.mocked(buildClearCookieHeader).mockReturnValue("clear-cookie");

		const res = await Effect.runPromise(accountDelete(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", "clear-cookie");
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc-key");
	});

	it("returns 403 Response when CSRF check throws AuthenticationError", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
			resHeadersAppend: vi.fn(),
		});

		vi.mocked(verifySameOriginOrThrow).mockImplementation(() => {
			throw new AuthenticationError({ message: "Invalid origin" });
		});

		const res = await Effect.runPromise(accountDelete(ctx));
		expect(res).toBeInstanceOf(Response);
		expect(res.status).toBe(HTTP_FORBIDDEN);
		const body = await res.json();
		expect(body).toStrictEqual({ error: "Invalid origin" });
	});

	it("fails when DB delete returns an error", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
			resHeadersAppend: vi.fn(),
		});

		vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
		vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>({
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
					user_id: SAMPLE_USER_ID,
				},
				userPublic: { user_id: SAMPLE_USER_ID, username: "testuser" },
				oauthUserData: { email: "u@example.com" },
				oauthState: { csrf: "x", lang: "en", provider: "google" },
				ip: "127.0.0.1",
			}),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			userDeleteError: { message: "delete failed" },
		});

		await expect(Effect.runPromise(accountDelete(ctx))).rejects.toThrow(
			/Database error deleting user/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
			resHeadersAppend: vi.fn(),
		});

		vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
		vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(accountDelete(ctx))).rejects.toThrow(/Not authenticated/);
	});
});
