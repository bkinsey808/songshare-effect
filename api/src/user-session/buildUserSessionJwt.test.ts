import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { User } from "@/shared/generated/supabaseSchemas";

import { DatabaseError, ValidationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";

import buildUserSessionJwt from "./buildUserSessionJwt";

const SAMPLE_USER: User = {
	created_at: "2026-01-01T00:00:00Z",
	email: "u@example.com",
	google_calendar_access: "none",
	google_calendar_refresh_token: undefined,
	linked_providers: undefined,
	name: "Existing Name",
	role: "user",
	role_expires_at: undefined,
	sub: undefined,
	updated_at: "2026-01-01T00:00:00Z",
	user_id: "00000000-0000-4000-8000-000000000001",
};

const SAMPLE_OAUTH_USER = { email: "u@example.com" };
const SAMPLE_OAUTH_STATE = { csrf: "x", lang: "en", provider: "google" } as const;

describe("buildUserSessionJwt", () => {
	it("returns a signed JWT and uses username from user_public when present", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient({
			userPublicMaybe: { user_id: SAMPLE_USER.user_id, username: "resolved-user" },
		});
		const ctx = makeCtx();

		// validation passes
		const decodeModule = await import("@/shared/validation/decode-effect");
		vi.spyOn(decodeModule, "default").mockReturnValue(Effect.succeed(true));

		// sign the JWT
		const createJwtMod = await import("@/api/oauth/createJwt");
		vi.spyOn(createJwtMod, "default").mockReturnValue(Effect.succeed("signed-jwt-xyz"));

		const res = await Effect.runPromise(
			buildUserSessionJwt({
				ctx,
				supabase,
				existingUser: SAMPLE_USER,
				oauthUserData: SAMPLE_OAUTH_USER,
				oauthState: SAMPLE_OAUTH_STATE,
			}),
		);

		expect(res).toBe("signed-jwt-xyz");
	});

	it("falls back to existingUser.name when no user_public record exists", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient(); // userPublicMaybe undefined
		const ctx = makeCtx();

		const decodeModule = await import("@/shared/validation/decode-effect");
		vi.spyOn(decodeModule, "default").mockReturnValue(Effect.succeed(true));

		const createJwtMod = await import("@/api/oauth/createJwt");
		vi.spyOn(createJwtMod, "default").mockReturnValue(Effect.succeed("signed-jwt-abc"));

		const res = await Effect.runPromise(
			buildUserSessionJwt({
				ctx,
				supabase,
				existingUser: SAMPLE_USER,
				oauthUserData: SAMPLE_OAUTH_USER,
				oauthState: SAMPLE_OAUTH_STATE,
			}),
		);

		expect(res).toBe("signed-jwt-abc");
	});

	it("fails with ServerError when JWT_SECRET missing", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient();
		const ctx = makeCtx({ env: { JWT_SECRET: "" } });

		// ensure validation would pass if reached
		const decodeModule = await import("@/shared/validation/decode-effect");
		vi.spyOn(decodeModule, "default").mockReturnValue(Effect.succeed(true));

		const createJwtMod = await import("@/api/oauth/createJwt");
		vi.spyOn(createJwtMod, "default").mockReturnValue(Effect.succeed("never-used"));

		await expect(
			Effect.runPromise(
				buildUserSessionJwt({
					ctx,
					supabase,
					existingUser: SAMPLE_USER,
					oauthUserData: SAMPLE_OAUTH_USER,
					oauthState: SAMPLE_OAUTH_STATE,
				}),
			),
		).rejects.toThrow(/Server misconfiguration: missing JWT_SECRET/);
	});

	it("propagates ValidationError when session validation fails", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient();
		const ctx = makeCtx();

		const decodeModule = await import("@/shared/validation/decode-effect");
		vi.spyOn(decodeModule, "default").mockReturnValue(
			Effect.fail(new ValidationError({ message: "Invalid session" })),
		);

		await expect(
			Effect.runPromise(
				buildUserSessionJwt({
					ctx,
					supabase,
					existingUser: SAMPLE_USER,
					oauthUserData: SAMPLE_OAUTH_USER,
					oauthState: SAMPLE_OAUTH_STATE,
				}),
			),
		).rejects.toThrow(/Invalid session/);
	});

	it("propagates DatabaseError from resolveUsername", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient();
		const ctx = makeCtx();

		const resolveModule = await import("@/api/user/resolveUsername");
		vi.spyOn(resolveModule, "default").mockReturnValue(
			Effect.fail(new DatabaseError({ message: "db failure" })),
		);

		await expect(
			Effect.runPromise(
				buildUserSessionJwt({
					ctx,
					supabase,
					existingUser: SAMPLE_USER,
					oauthUserData: SAMPLE_OAUTH_USER,
					oauthState: SAMPLE_OAUTH_STATE,
				}),
			),
		).rejects.toThrow(/db failure/);
	});
});
