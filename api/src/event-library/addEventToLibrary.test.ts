import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/test-utils/makeCtx.mock";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";
import spyImport from "@/react/lib/test-utils/spy-import/spyImport";

import addEventToLibraryHandler from "./addEventToLibrary";

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

describe("addEventToLibraryHandler", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });
		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("fails when request is missing event_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/Request must contain event_id/,
		);
	});

	it("fails when event_id is not a string", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: 123 } });

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/event_id must be a string/,
		);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
		);

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/Not authenticated/,
		);
	});

	it("fails when event lookup returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({ eventPublicSelectError: { message: "not found" } });

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/Event not found/,
		);
	});

	it("fails when event owner is missing", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({ eventPublicSelectRow: {} });

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/Event owner not found/,
		);
	});

	it("fails when insert returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			eventPublicSelectRow: { owner_id: "owner-1" },
			eventLibraryInsertError: { message: "duplicate" },
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(/duplicate/);
	});

	it("fails when insert returns no data", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const fakeSupabase = makeSupabaseClient({
			eventPublicSelectRow: { owner_id: "owner-1" },
			eventLibraryInsertRows: [undefined],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		await expect(Effect.runPromise(addEventToLibraryHandler(ctx))).rejects.toThrow(
			/No data returned from insert/,
		);
	});

	it("inserts into event_library and returns created entry (happy path)", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { event_id: "evt-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_USER_SESSION),
		);

		const createdAt = "2026-01-01T00:00:00Z";
		const fakeSupabase = makeSupabaseClient({
			eventPublicSelectRow: { owner_id: "owner-1" },
			eventLibraryInsertRows: [
				{
					created_at: createdAt,
					event_id: "evt-1",
					user_id: "user-123",
					event_owner_id: "owner-1",
				},
			],
		});

		const mockGet = await spyImport("@/api/supabase/getSupabaseServerClient");
		mockGet.mockReturnValue(fakeSupabase);

		const res = await Effect.runPromise(addEventToLibraryHandler(ctx));

		expect(res).toStrictEqual({
			created_at: createdAt,
			event_id: "evt-1",
			user_id: "user-123",
			event_owner_id: "owner-1",
		});
	});
});
