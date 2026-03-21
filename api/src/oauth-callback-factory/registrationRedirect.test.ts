import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { registerCookieName } from "@/api/cookie/cookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import { asEnv, asParams } from "@/api/oauth-callback-factory/registrationRedirect.test-util";
import buildRegisterJwt from "@/api/register/buildRegisterJwt";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";
import { registerPath } from "@/shared/paths";

import handleRegistration, {
    type RegistrationRedirectParams,
    SEE_OTHER,
} from "./registrationRedirect";

// stub buildRegisterJwt so we don't have to construct a real context
vi.mock("@/api/register/buildRegisterJwt");

/**
 * Builds minimal valid RegistrationRedirectParams with makeCtx and default oauth data.
 * @returns minimal valid params
 */
function makeBaseParams(): RegistrationRedirectParams {
	const ctx = makeCtx();
	// build a minimal valid parameter set; return cast to satisfy ctx type
	return asParams({
		ctx,
		envRecord: asEnv(ctx.env),
		oauthUserData: { email: "a@b.com" } as OauthUserData,
		oauthState: { csrf: "c", lang: "en", provider: "google" } as OauthState,
		lang: "en",
	});
}

/**
 * Merges base params with a new ctx and envRecord for tests that need a custom context.
 * @param base - base params
 * @param ctx - new context
 * @returns updated params
 */
function addCtxToParams(
	base: RegistrationRedirectParams,
	ctx: ReturnType<typeof makeCtx>,
): RegistrationRedirectParams {
	return { ...base, ctx, envRecord: ctx.env } as RegistrationRedirectParams;
}

/**
 * Extracts Set-Cookie header from Hono response for assertions.
 * @param ctx - request context
 * @returns cookie header value
 */
function getCookieHeader(ctx: ReturnType<typeof makeCtx>): string | null {
	return ctx.res.headers.get("Set-Cookie");
}

describe("handleRegistration helper", () => {
	const baseParams: RegistrationRedirectParams = makeBaseParams();

	it("returns a redirect response and sets a cookie header", async () => {
		vi.mocked(buildRegisterJwt).mockImplementation(() => Effect.succeed("fake-jwt"));
		const params = { ...baseParams };
		const response = await Effect.runPromise(handleRegistration(params));

		expect(response.status).toBe(SEE_OTHER);
		expect(response.headers.get("Location")).toBe(`/${params.lang}/${registerPath}`);
		const cookieHeader = params.ctx.res.headers.get("Set-Cookie");
		expect(cookieHeader).toContain(`${registerCookieName}=fake-jwt`);
	});

	it("uses client-debug header when env flag is true", async () => {
		vi.mocked(buildRegisterJwt).mockImplementation(() => Effect.succeed("fake-jwt"));
		const ctx = makeCtx({ env: { REGISTER_COOKIE_CLIENT_DEBUG: "true" } });
		const params = addCtxToParams(baseParams, ctx);
		await Effect.runPromise(handleRegistration(params));

		const cookieHeader = getCookieHeader(ctx);
		expect(cookieHeader).toContain(`${registerCookieName}=fake-jwt`);
		// should include Max-Age portion since debug branch pieces directly build the string
		expect(cookieHeader).toContain("Max-Age=604800");
	});
});
