import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/test-utils/makeCtx.mock";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.mock";

import eventUserJoinHandler from "./eventUserJoin";

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

describe("eventUserJoinHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserJoinHandler(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing event_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		await expect(Effect.runPromise(eventUserJoinHandler(ctx))).rejects.toThrow(/is missing/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(eventUserJoinHandler(ctx))).rejects.toThrow(/Not authenticated/);
	});

	it("fails when event lookup returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleError: { message: "not found" },
		});

		await expect(Effect.runPromise(eventUserJoinHandler(ctx))).rejects.toThrow(/Event not found/);
	});

	it("returns success when user is already joined", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleRow: { event_id: "evt-1" },
			eventUserInsertRows: [],
		});

		const res = await Effect.runPromise(eventUserJoinHandler(ctx));

		expect(res).toStrictEqual({ success: true });
	});

	it("rejects rejoin when existing membership is kicked", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleRow: { event_id: "evt-1" },
			eventUserSelectRow: { role: "kicked" },
		});

		await expect(Effect.runPromise(eventUserJoinHandler(ctx))).rejects.toThrow(/cannot rejoin/);
	});

	it("joins event and returns success (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { event_id: "evt-1" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc" },
		});

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		mockCreateSupabaseClient(vi.mocked(createClient), {
			eventSelectSingleRow: { event_id: "evt-1" },
			eventUserInsertRows: [{ event_id: "evt-1", user_id: "requester-1", role: "participant" }],
		});

		const res = await Effect.runPromise(eventUserJoinHandler(ctx));

		expect(res).toStrictEqual({ success: true });
		expect(vi.mocked(createClient)).toHaveBeenCalledWith("url", "svc");
	});
});
