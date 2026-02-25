import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import playlistDeleteHandler from "./playlistDelete";

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

describe("playlistDelete handler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing playlist_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(/is missing/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: "pl-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("wraps thrown errors during ownership check", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistSelectThrows: new Error("boom"),
		});

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(
			/Failed to verify playlist ownership: boom/,
		);
	});

	it("fails when ownership lookup returns error object", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistSelectSingleError: { message: "not found" },
		});

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(/not found/);
	});

	it("rejects when user does not own the playlist", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistSelectSingleRow: { user_id: "someone-else" },
		});

		await expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(
			/permission to delete this playlist/,
		);
	});

	it("returns success and constructs client with env (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistSelectSingleRow: { user_id: "requester-1" },
		});

		const res = await Effect.runPromise(playlistDeleteHandler(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});

	it.each([
		["playlist_library", "playlistLibraryDeleteError", /Failed to remove playlist from libraries/],
		["playlist_public", "playlistPublicDeleteError", /Failed to delete public playlist/],
		["playlist", "playlistDeleteError", /Failed to delete private playlist/],
	])(
		"propagates error when %s delete fails",
		async (_table: string, errorKey: string, expected: RegExp) => {
			vi.resetAllMocks();
			const ctx = makeCtx({
				body: { playlist_id: "pl-1" },
				env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
			});

			const verifiedModule = await import("@/api/user-session/getVerifiedSession");
			vi.spyOn(verifiedModule, "default").mockReturnValue(
				Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
			);

			mockCreateSupabaseClient(vi.mocked(createClient), {
				playlistSelectSingleRow: { user_id: "requester-1" },
				[errorKey]: new Error("boom"),
			});

			return expect(Effect.runPromise(playlistDeleteHandler(ctx))).rejects.toThrow(expected);
		},
	);
});
