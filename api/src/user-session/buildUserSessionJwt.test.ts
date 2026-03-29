import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { DatabaseError, ValidationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import type { User } from "@/shared/generated/supabaseSchemas";
import makeUser from "@/shared/test-utils/makeUser.test-util";

import buildUserSessionJwt from "./buildUserSessionJwt";

const SAMPLE_USER: User = makeUser({
	name: "Existing Name",
});

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
		const decodeModule = await import("@/shared/validation/decodeUnknownEffectOrMap");
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

		const decodeModule = await import("@/shared/validation/decodeUnknownEffectOrMap");
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

	it("fails with ServerError when SUPABASE_JWT_SECRET missing", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient();
		const ctx = makeCtx({ env: { SUPABASE_JWT_SECRET: "" } });

		// ensure validation would pass if reached
		const decodeModule = await import("@/shared/validation/decodeUnknownEffectOrMap");
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
		).rejects.toThrow(/Server misconfiguration: missing SUPABASE_JWT_SECRET/);
	});

	it("propagates ValidationError when session validation fails", async () => {
		vi.resetAllMocks();

		const supabase = makeSupabaseClient();
		const ctx = makeCtx();

		const decodeModule = await import("@/shared/validation/decodeUnknownEffectOrMap");
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
