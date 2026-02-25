import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import playlistSaveHandler from "./playlistSave";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";

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
		user_id: SAMPLE_USER_ID,
	},
	userPublic: { user_id: SAMPLE_USER_ID, username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

// helpers used by multiple tests to avoid inline disables
function stubCryptoUuid(uuid: string): void {
	vi.stubGlobal("crypto", { randomUUID: () => uuid });
}

function publicNotes(res: unknown): unknown {
	if (typeof res === "object" && res !== null && "public_notes" in res) {
		return (res as { public_notes: unknown }).public_notes;
	}
	return undefined;
}

describe("playlistSave handler", () => {
	it("creates playlist (happy path)", async () => {
		vi.resetAllMocks();
		const uuid = "generated-uuid";
		stubCryptoUuid(uuid);

		const ctx = makeCtx({
			body: {
				playlist_name: "My List",
				playlist_slug: "my-list",
				song_order: ["s1", "s2"],
			},
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

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

		const publicRow = {
			playlist_id: uuid,
			user_id: SAMPLE_USER_ID,
			playlist_name: "My List",
			playlist_slug: "my-list",
			public_notes: undefined,
			song_order: ["s1", "s2"],
		};

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistInsertRows: [{ playlist_id: uuid, user_id: SAMPLE_USER_ID, private_notes: "" }],
			playlistPublicInsertRows: [publicRow],
			playlistLibraryInsertRows: [
				{ user_id: SAMPLE_USER_ID, playlist_id: uuid, playlist_owner_id: SAMPLE_USER_ID },
			],
		});

		const res = await Effect.runPromise(playlistSaveHandler(ctx));

		expect(res).toStrictEqual(publicRow);
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

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

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when required field is missing", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { playlist_slug: "slug", song_order: [] } });

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

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/is missing/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: {
				playlist_name: "X",
				playlist_slug: "x",
				song_order: [],
			},
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		const apiErrors = await import("../api-errors");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new apiErrors.AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("wraps thrown errors during ownership check", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1", playlist_name: "n", playlist_slug: "s", song_order: [] },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistPublicSelectThrows: new Error("boom"),
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(
			/Failed to verify playlist ownership: boom/,
		);
	});

	it("fails when ownership lookup returns error object", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1", playlist_name: "n", playlist_slug: "s", song_order: [] },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistPublicSelectSingleError: { message: "not found" },
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/not found/);
	});

	it("rejects when user does not own the playlist", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_id: "pl-1", playlist_name: "n", playlist_slug: "s", song_order: [] },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistPublicSelectSingleRow: { user_id: "someone-else" },
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(
			/permission to update this playlist/,
		);
	});

	it("fails when private insert returns a DB error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { playlist_name: "n", playlist_slug: "s", song_order: [] },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistInsertError: { message: "bad private" },
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/bad private/);
	});

	it("cleans up and fails when public insert returns a DB error", async () => {
		vi.resetAllMocks();
		const uuid = "created";
		stubCryptoUuid(uuid);

		const ctx = makeCtx({
			body: { playlist_name: "n", playlist_slug: "s", song_order: [] },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistInsertRows: [{ playlist_id: uuid, user_id: SAMPLE_USER_ID, private_notes: "" }],
			playlistPublicInsertError: { message: "public fail" },
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(/public fail/);
	});

	it("returns success even if library insertion fails", async () => {
		vi.resetAllMocks();
		const uuid = "lib-id";
		stubCryptoUuid(uuid);

		const ctx = makeCtx({
			body: { playlist_name: "L", playlist_slug: "l", song_order: [] },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistInsertRows: [{ playlist_id: uuid, user_id: SAMPLE_USER_ID, private_notes: "" }],
			playlistPublicInsertRows: [
				{
					playlist_id: uuid,
					user_id: SAMPLE_USER_ID,
					playlist_name: "L",
					playlist_slug: "l",
					song_order: [],
				},
			],
			playlistLibraryInsertError: new Error("library fail"),
		});

		await expect(Effect.runPromise(playlistSaveHandler(ctx))).rejects.toThrow(
			/Playlist created but failed to add to library: library fail/,
		);
		expect(warnSpy).toHaveBeenCalledWith(
			"Failed to add playlist to library (non-fatal): library fail",
		);
	});

	it("updates playlist when user is owner (update happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: {
				playlist_id: "pl-9",
				playlist_name: "New",
				playlist_slug: "new",
				song_order: ["1", "2"],
			},
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			playlistPublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			playlistUpdateRow: { playlist_id: "pl-9", private_notes: "" },
			playlistPublicUpdateRow: {
				playlist_id: "pl-9",
				playlist_name: "New",
				playlist_slug: "new",
				song_order: ["1", "2"],
				public_notes: undefined,
			},
		});

		const res: unknown = await Effect.runPromise(playlistSaveHandler(ctx));
		expect(res).toMatchObject({
			playlist_name: "New",
			playlist_slug: "new",
			song_order: ["1", "2"],
		});
		expect(publicNotes(res)).toBeUndefined();
	});
});
