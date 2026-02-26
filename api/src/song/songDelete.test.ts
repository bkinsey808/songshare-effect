import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";

import songDelete from "./songDelete";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/user-session/getVerifiedSession");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Patch a fake Supabase client so calls to `.from('song').delete().eq(...).eq(...)`
 * return the provided response or throw when configured.
 */
/* oxlint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */
function patchSongDelete(
	client: unknown,
	resp: { data?: unknown; error?: unknown } | ((...args: unknown[]) => Promise<unknown>),
): ReturnType<typeof createClient> {
	const fakeClient: any = client;
	const orig: any = fakeClient.from?.bind(fakeClient);
	Reflect.set(fakeClient, "from", (table: string) => {
		if (table === "song") {
			return {
				delete: (): any => ({
					eq: (_field: string, _val: string): any => ({
						eq: (_field2: string, _val2: string): any => {
							if (typeof resp === "function") {
								return resp(_field, _val, _field2, _val2);
							}
							return Promise.resolve(resp);
						},
					}),
				}),
			};
		}
		if (orig !== undefined) {
			return orig(table);
		}
		return undefined;
	});
	return fakeClient as ReturnType<typeof createClient>;
}
/* oxlint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion */

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

describe("songDelete", () => {
	it("deletes song when payload is valid", async () => {
		vi.resetAllMocks();

		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		// patch supabase delete to succeed
		// create an empty object and treat as Supabase client for patching
		const baseClient = {} as unknown;
		const patched = patchSongDelete(baseClient, { data: undefined, error: undefined });
		vi.mocked(createClient).mockReturnValue(patched);

		const res = await Effect.runPromise(songDelete(ctx));
		expect(res).toStrictEqual({ success: true });
	});

	it("returns ValidationError when JSON body is invalid", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: new Error("bad json") });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when request is missing song_id", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: {} });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/is missing/);
	});

	it("rejects when song_id is only whitespace", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "   " } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/song_id is required/);
	});

	it("propagates authentication failure from getVerifiedUserSession", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.fail(new AuthenticationError({ message: "Not auth" })),
		);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/Not auth/);
	});

	it("fails when Supabase returns an error", async () => {
		vi.resetAllMocks();
		const ctx = makeCtx({ body: { song_id: "song-1" } });

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.spyOn(verifiedModule, "default").mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		// patch supabase delete to return error
		const baseClient = {} as unknown;
		const patched = patchSongDelete(baseClient, {
			data: undefined,
			error: { message: "delete failed" },
		});
		vi.mocked(createClient).mockReturnValue(patched);

		await expect(Effect.runPromise(songDelete(ctx))).rejects.toThrow(/delete failed/);
	});
});
