import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Env } from "@/api/env";
import type buildRegisterJwt from "@/api/register/buildRegisterJwt";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

import { registerCookieName } from "@/api/cookie/cookie";
import { registerPath } from "@/shared/paths";

import handleRegistration, {
    type RegistrationRedirectParams,
    SEE_OTHER,
} from "./registrationRedirect";

// stub buildRegisterJwt so we don't have to construct a real context
vi.mock("@/api/register/buildRegisterJwt", (): { default: typeof buildRegisterJwt } => ({
	default: vi.fn(() => Effect.succeed("fake-jwt")),
}));

// minimal subset of Hono Context used in this test
type DummyCtx = {
	res: { headers: Headers };
	env: { REGISTER_COOKIE_CLIENT_DEBUG: string; [key: string]: unknown };
	req: { header: (name: string) => string; url: string };
	redirect: (location: string, status?: number) => Response;
};

function makeCtx(clientDebug = "false"): DummyCtx {
	const headers = new Headers();
	return {
		res: { headers },
		env: { REGISTER_COOKIE_CLIENT_DEBUG: clientDebug },
		req: { header: () => "", url: "https://example.com" },
		redirect: (loc: string, status = SEE_OTHER) =>
			new Response(undefined, { status, headers: { Location: loc } }),
	};
}

function makeBaseParams(): RegistrationRedirectParams {
	// build a minimal valid parameter set; return cast to satisfy ctx type
	return {
		ctx: makeCtx(),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		envRecord: {} as unknown as Env,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		oauthUserData: { email: "a@b.com" } as OauthUserData,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		oauthState: { csrf: "c", lang: "en", provider: "google" } as OauthState,
		lang: "en",
	} as unknown as RegistrationRedirectParams;
}

function addCtxToParams(
	base: RegistrationRedirectParams,
	ctx: DummyCtx,
): RegistrationRedirectParams {
	// ctx is already the right shape (DummyCtx)
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
	return { ...base, ctx, envRecord: ctx.env as Env } as RegistrationRedirectParams;
}

function getCookieHeader(ctx: DummyCtx): string | null {
	return ctx.res.headers.get("Set-Cookie");
}

describe("handleRegistration helper", () => {
	const baseParams: RegistrationRedirectParams = makeBaseParams();

	it("returns a redirect response and sets a cookie header", async () => {
		const params = { ...baseParams };
		const response = await Effect.runPromise(handleRegistration(params));

		expect(response.status).toBe(SEE_OTHER);
		expect(response.headers.get("Location")).toBe(`/${params.lang}/${registerPath}`);
		const cookieHeader = params.ctx.res.headers.get("Set-Cookie");
		expect(cookieHeader).toContain(`${registerCookieName}=fake-jwt`);
	});

	it("uses client-debug header when env flag is true", async () => {
		const ctx = makeCtx("true");
		const params = addCtxToParams(baseParams, ctx);
		await Effect.runPromise(handleRegistration(params));

		const cookieHeader = getCookieHeader(ctx);
		expect(cookieHeader).toContain(`${registerCookieName}=fake-jwt`);
		// should include Max-Age portion since debug branch pieces directly build the string
		expect(cookieHeader).toContain("Max-Age=604800");
	});
});
