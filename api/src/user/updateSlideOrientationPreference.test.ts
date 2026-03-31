import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import asNull from "@/react/lib/test-utils/asNull";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import updateSlideOrientationPreference from "./updateSlideOrientationPreference";

vi.mock("@/api/supabase/getSupabaseServerClient");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/user-session/buildUserSessionJwt");

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});
const SESSION_JWT = "session-jwt";

describe("updateSlideOrientationPreference", () => {
	it("returns ValidationError when JSON body is invalid", async () => {
		const ctx = makeCtx({ body: new Error("bad json") });

		await expect(Effect.runPromise(updateSlideOrientationPreference(ctx))).rejects.toThrow(
			/Invalid JSON body/,
		);
	});

	it("updates the signed-in user preference and returns it", async () => {
		vi.resetAllMocks();

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const eq = vi.fn().mockResolvedValue({ error: asNull() });
		const update = vi.fn(() => ({ eq }));
		const from = vi.fn(() => ({ update }));

		const getSupabaseServerClientModule = await import("@/api/supabase/getSupabaseServerClient");
		vi.mocked(getSupabaseServerClientModule.default).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseServerClientModule.default>>({
				from,
			}),
		);
		const buildUserSessionJwtModule = await import("@/api/user-session/buildUserSessionJwt");
		vi.mocked(buildUserSessionJwtModule.default).mockReturnValue(Effect.succeed(SESSION_JWT));

		const ctx = makeCtx({
			body: {
				slideOrientationPreference: "portrait",
			},
		});

		const result = await Effect.runPromise(updateSlideOrientationPreference(ctx));

		expect(from).toHaveBeenCalledWith("user");
		expect(update).toHaveBeenCalledWith({
			slide_orientation_preference: "portrait",
		});
		expect(eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
		expect(vi.mocked(buildUserSessionJwtModule.default)).toHaveBeenCalledWith({
			ctx,
			supabase: forceCast<ReturnType<typeof getSupabaseServerClientModule.default>>({
				from,
			}),
			existingUser: {
				...SAMPLE_SESSION.user,
				slide_orientation_preference: "portrait",
			},
			oauthUserData: SAMPLE_SESSION.oauthUserData,
			oauthState: SAMPLE_SESSION.oauthState,
		});
		expect(ctx.res.headers.get("Set-Cookie")).toContain(`${userSessionCookieName}=${SESSION_JWT}`);
		expect(result).toStrictEqual({
			slideOrientationPreference: "portrait",
		});
	});
});
