import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";
import type { UserSessionData } from "@/shared/userSessionData";

import removePlaylistFromLibraryHandler from "./removePlaylistFromLibrary";

vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/supabase/getSupabaseServerClient");

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
		user_id: "user-123",
	},
	userPublic: { user_id: "user-123", username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

describe("removePlaylistFromLibraryHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(removePlaylistFromLibraryHandler(ctx))).rejects.toThrow(
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

		await expect(Effect.runPromise(removePlaylistFromLibraryHandler(ctx))).rejects.toThrow(
			/Request must contain playlist_id/,
		);
	});

	it("fails when playlist_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: 123 } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(removePlaylistFromLibraryHandler(ctx))).rejects.toThrow(
			/playlist_id must be a string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: "pl-1" } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(removePlaylistFromLibraryHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when delete returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: "pl-1" } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			playlistLibraryDeleteError: new Error("delete failed"),
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(removePlaylistFromLibraryHandler(ctx))).rejects.toThrow(
			/delete failed/,
		);
	});

	it("deletes from playlist_library and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_id: "pl-1" } });
		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(removePlaylistFromLibraryHandler(ctx));

		expect(res).toStrictEqual({ success: true });
	});
});
