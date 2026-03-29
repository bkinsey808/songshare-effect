import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeCtx from "@/api/hono/makeCtx.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import getVerifiedUserSession from "./getVerifiedSession";

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});

describe("getVerifiedUserSession", () => {
	it("returns validated session when token present and verification succeeds", async () => {
		vi.resetAllMocks();

		// mock extracted token
		const extractModule = await import("@/api/user-session/extractUserSessionTokenFromContext");
		vi.spyOn(extractModule, "default").mockReturnValue(Effect.succeed("tok-abc"));

		// mock verifier to return a raw payload (shape not important because we
		// will mock the decoder below)
		const verifyModule = await import("@/api/user-session/verifyUserSessionToken");
		vi.spyOn(verifyModule, "default").mockReturnValue(Effect.succeed({ foo: "bar" }));

		// mock schema decoder to return the validated session data
		const decodeModule = await import("@/shared/validation/decodeUnknownEffectOrMap");
		vi.spyOn(decodeModule, "default").mockReturnValue(Effect.succeed(SAMPLE_SESSION));

		const ctx = makeCtx({
			headers: { Cookie: "userSession=tok-abc;" },
			env: { SUPABASE_JWT_SECRET: "jwt-secret" },
		});

		const res = await Effect.runPromise(getVerifiedUserSession(ctx));
		expect(res).toStrictEqual(SAMPLE_SESSION);
	});

	it("throws AuthenticationError when token missing", async () => {
		vi.resetAllMocks();

		const extractModule2 = await import("@/api/user-session/extractUserSessionTokenFromContext");
		vi.spyOn(extractModule2, "default").mockReturnValue(Effect.succeed(undefined));

		await expect(
			Effect.runPromise(
				getVerifiedUserSession(makeCtx({ env: { SUPABASE_JWT_SECRET: "jwt-secret" } })),
			),
		).rejects.toThrow(/Not authenticated/);
	});

	it("throws DatabaseError when SUPABASE_JWT_SECRET missing", async () => {
		vi.resetAllMocks();

		const extractModule3 = await import("@/api/user-session/extractUserSessionTokenFromContext");
		vi.spyOn(extractModule3, "default").mockReturnValue(Effect.succeed("tok"));

		// jwt secret intentionally missing from env
		await expect(
			Effect.runPromise(getVerifiedUserSession(makeCtx({ env: { SUPABASE_JWT_SECRET: "" } }))),
		).rejects.toThrow(/Server configuration error/);
	});

	it("propagates AuthenticationError from token verification", async () => {
		vi.resetAllMocks();

		const extractModule4 = await import("@/api/user-session/extractUserSessionTokenFromContext");
		vi.spyOn(extractModule4, "default").mockReturnValue(Effect.succeed("tok"));

		const verifyMod = await import("@/api/user-session/verifyUserSessionToken");
		const apiErrors = await import("@/api/api-errors");
		vi.spyOn(verifyMod, "default").mockReturnValue(
			Effect.fail(new apiErrors.AuthenticationError({ message: "Invalid token" })),
		);

		await expect(
			Effect.runPromise(getVerifiedUserSession(makeCtx({ env: { SUPABASE_JWT_SECRET: "x" } }))),
		).rejects.toThrow(/Invalid token/);
	});

	it("throws AuthenticationError when decoded session validation fails", async () => {
		vi.resetAllMocks();

		const extractModule5 = await import("@/api/user-session/extractUserSessionTokenFromContext");
		vi.spyOn(extractModule5, "default").mockReturnValue(Effect.succeed("tok"));

		const verifyMod2 = await import("@/api/user-session/verifyUserSessionToken");
		vi.spyOn(verifyMod2, "default").mockReturnValue(Effect.succeed({ bad: "payload" }));

		const decodeModule2 = await import("@/shared/validation/decodeUnknownEffectOrMap");
		const apiErrors2 = await import("@/api/api-errors");
		vi.spyOn(decodeModule2, "default").mockReturnValue(
			Effect.fail(new apiErrors2.AuthenticationError({ message: "Invalid session" })),
		);

		await expect(
			Effect.runPromise(getVerifiedUserSession(makeCtx({ env: { SUPABASE_JWT_SECRET: "x" } }))),
		).rejects.toThrow(/Invalid session/);
	});
});
