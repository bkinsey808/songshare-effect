import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import asNull from "@/api/test-utils/asNull";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import type { UserSessionData } from "@/shared/userSessionData";

import updateSlideNumberPreference from "./updateSlideNumberPreference";

vi.mock("@/api/supabase/getSupabaseServerClient");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/user-session/buildUserSessionJwt");

const SAMPLE_SESSION: UserSessionData = makeUserSessionData({});
const SESSION_JWT = "session-jwt";

describe("updateSlideNumberPreference", () => {
	it("updates the signed-in user preference, refreshes the session cookie, and returns it", async () => {
		vi.resetAllMocks();

		const verifiedModule = await import("@/api/user-session/getVerifiedSession");
		vi.mocked(verifiedModule.default).mockReturnValue(
			Effect.succeed<UserSessionData>(SAMPLE_SESSION),
		);

		const eq = vi.fn().mockResolvedValue({ error: asNull() });
		const update = vi.fn(() => ({ eq }));
		const from = vi.fn(() => ({ update }));

		const getSupabaseServerClientModule = await import("@/api/supabase/getSupabaseServerClient");
		const client = forceCast<ReturnType<typeof getSupabaseServerClientModule.default>>({
			from,
		});
		vi.mocked(getSupabaseServerClientModule.default).mockReturnValue(client);

		const buildUserSessionJwtModule = await import("@/api/user-session/buildUserSessionJwt");
		vi.mocked(buildUserSessionJwtModule.default).mockReturnValue(Effect.succeed(SESSION_JWT));

		const ctx = makeCtx({
			body: {
				slideNumberPreference: "show",
			},
		});

		const result = await Effect.runPromise(updateSlideNumberPreference(ctx));

		expect(from).toHaveBeenCalledWith("user");
		expect(update).toHaveBeenCalledWith({
			slide_number_preference: "show",
		});
		expect(eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
		expect(vi.mocked(buildUserSessionJwtModule.default)).toHaveBeenCalledWith({
			ctx,
			supabase: client,
			existingUser: {
				...SAMPLE_SESSION.user,
				slide_number_preference: "show",
			},
			oauthUserData: SAMPLE_SESSION.oauthUserData,
			oauthState: SAMPLE_SESSION.oauthState,
		});
		expect(ctx.res.headers.get("Set-Cookie")).toContain(`${userSessionCookieName}=${SESSION_JWT}`);
		expect(result).toStrictEqual({
			slideNumberPreference: "show",
		});
	});
});
