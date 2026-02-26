import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import getVerifiedSession from "@/api/user-session/getVerifiedSession";

import songSave from "./songSave";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";

describe("songSave handler", () => {
	const SAMPLE_SESSION: UserSessionData = {
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

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when required fields are missing", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_slug: "s" } });

		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/is missing/);

		vi.mocked(getVerifiedSession).mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "No auth" })),
		);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/No auth/);
	});

	it("creates a new song successfully", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
			songPublicInsertRows: [{ song_id: "new", user_id: SAMPLE_USER_ID }],
		});
		vi.mocked(createClient).mockReturnValue(fake);

		const res = await Effect.runPromise(songSave(ctx));
		expect(res).toStrictEqual({ song_id: "new", user_id: SAMPLE_USER_ID });
	});

	it("fails update when user does not own the song", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: {
				song_id: "old",
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: "other" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/permission to update/);
	});

	it("updates existing song successfully", async () => {
		const ctx = makeCtx({
			body: {
				song_id: "old",
				song_name: "n",
				song_slug: "s",
				fields: [],
				slide_order: [],
				slides: {},
			},
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songPublicSelectSingleRow: { user_id: SAMPLE_USER_ID },
			songUpdateRow: { song_id: "old" },
			songPublicUpdateRow: { song_id: "old" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		const res = await Effect.runPromise(songSave(ctx));
		expect(res).toStrictEqual({ song_id: "old" });
	});

	it("fails when private insert errors", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertError: { message: "oops" },
		});
		vi.mocked(createClient).mockReturnValue(fake);
		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/oops/);
	});

	it("fails when public insert errors and cleans up", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({
			body: { song_name: "n", song_slug: "s", fields: [], slide_order: [], slides: {} },
		});
		vi.mocked(getVerifiedSession).mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const fake = makeSupabaseClient({
			songInsertRows: [{ song_id: "new" }],
			songPublicInsertError: { message: "pub fail" },
		});
		vi.mocked(createClient).mockReturnValue(fake);

		await expect(Effect.runPromise(songSave(ctx))).rejects.toThrow(/pub fail/);
	});
});
