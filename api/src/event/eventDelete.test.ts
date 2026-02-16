import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import makeCtx from "@/api/test-utils/makeCtx.mock";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.mock";

import eventDelete from "./eventDelete";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";

describe("eventDelete", () => {
	it("deletes event when user is owner (happy path)", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

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
			eventSelectSingleRow: { owner_id: SAMPLE_USER_ID },
		});

		const res = await Effect.runPromise(eventDelete(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("fails when user is not the owner", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

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
			eventSelectSingleRow: { owner_id: "other-id" },
		});

		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(
			/Only the event owner can delete this event/,
		);
	});

	it("fails when DB returns an error verifying owner", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { event_id: "evt-1" } });

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
			eventSelectSingleError: { message: "boom" },
		});

		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(/boom/);
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(eventDelete(ctx))).rejects.toThrow(/Invalid JSON body/);
	});
});
