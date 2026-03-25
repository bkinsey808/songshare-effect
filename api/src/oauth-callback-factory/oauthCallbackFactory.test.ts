import { Effect } from "effect";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import computeStateRedirectUri from "@/api/oauth-callback-factory/computeStateRedirectUri";
import {
	asFetchUserResult,
	asOauthState,
	asString,
} from "@/api/oauth-callback-factory/oauthCallbackFactory.test-util";
import rateLimit from "@/api/oauth-callback-factory/rateLimit";
import handleRegistration from "@/api/oauth-callback-factory/registrationRedirect";
import buildDashboardRedirectUrl from "@/api/oauth/buildDashboardRedirectUrl";
import fetchAndPrepareUser from "@/api/oauth/fetchAndPrepareUser";
// helper for creating minimal fake Supabase clients in tests
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import buildUserSessionJwt from "@/api/user-session/buildUserSessionJwt";
import type { OauthState } from "@/shared/oauth/oauthState";

import oauthCallbackFactory from "./oauthCallbackFactory";
import { SEE_OTHER } from "./registrationRedirect";

// share a fake client instance across tests; util handles typing
const fakeSupabase = makeSupabaseClient();

// mock every external dependency so tests can control their return values
vi.mock("@/api/oauth-callback-factory/rateLimit");
vi.mock("hono/jwt");
vi.mock("@/api/oauth-callback-factory/computeStateRedirectUri");
vi.mock("@/api/oauth-callback-factory/registrationRedirect");
vi.mock("@/api/oauth/fetchAndPrepareUser");
vi.mock("@/api/user-session/buildUserSessionJwt");
vi.mock("@/api/cookie/buildSessionCookie");
vi.mock("@/api/oauth/buildDashboardRedirectUrl");
vi.mock("hono/cookie");

const mockedRateLimit = vi.mocked(rateLimit);
const mockedVerify = vi.mocked(verify);
const mockedComputeStateRedirectUri = vi.mocked(computeStateRedirectUri);
const mockedHandleRegistration = vi.mocked(handleRegistration);
const mockedFetchAndPrepareUser = vi.mocked(fetchAndPrepareUser);
const mockedBuildUserSessionJwt = vi.mocked(buildUserSessionJwt);
const mockedBuildSessionCookie = vi.mocked(buildSessionCookie);
const mockedBuildDashboardRedirectUrl = vi.mocked(buildDashboardRedirectUrl);
const mockedGetCookie = vi.mocked(getCookie);

/**
 * @param ctx - test context
 * @returns the Set-Cookie header value
 */
function getCookieHeader(ctx: ReturnType<typeof makeCtx>): string | null {
	return ctx.res.headers.get("Set-Cookie");
}

/**
 * Provide an explicit undefined value for mocks that avoids "confusing void expression"
 * lint errors by returning a non-void type.
 */
/**
 * @returns undefined (typed for mocks)
 */
function getMockUndefined(): string | undefined {
	return undefined;
}

/**
 * Resets mocks and sets defaults for tests.
 * @returns void
 */
function setup(): void {
	vi.clearAllMocks();
	// default mocks
	mockedRateLimit.mockResolvedValue(true);
	// provide minimal valid state so no assertion is needed
	mockedVerify.mockResolvedValue(
		asOauthState({
			csrf: "",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		}),
	);
	mockedComputeStateRedirectUri.mockReturnValue("https://callback");
	mockedHandleRegistration.mockImplementation(() =>
		Effect.succeed(new Response("reg", { status: SEE_OTHER })),
	);
	mockedFetchAndPrepareUser.mockResolvedValue(
		Effect.succeed(
			asFetchUserResult({
				supabase: fakeSupabase,
				oauthUserData: { email: "x" },
				existingUser: { linked_providers: ["google"] },
			}),
		),
	);
	mockedBuildUserSessionJwt.mockImplementation(() => Effect.succeed("jwt"));
	mockedBuildSessionCookie.mockImplementation(({ name }: { name: string }) => `${name}=val`);
	mockedBuildDashboardRedirectUrl.mockReturnValue("/dash");
	mockedGetCookie.mockReturnValue(getMockUndefined());
}

describe("oauthCallbackFactory", () => {
	it("redirects when rate limit disallows", async () => {
		setup();
		mockedRateLimit.mockResolvedValue(false);
		const ctx = makeCtx({ req: { url: "https://example.com/?code=1&state=2" } });
		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("rateLimit");
	});

	it("handles missing code or state", async () => {
		setup();
		const ctx = makeCtx({ req: { url: "https://example.com/" } });

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("missingData");
	});

	it("fails CSRF validation when cookie doesn't match", async () => {
		setup();
		const ctx = makeCtx({ req: { url: "https://example.com/?code=1&state=2" } });

		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue(asString("bad"));
		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("securityFailed");
	});

	it("delegates to handleRegistration when user is new", async () => {
		setup();
		const ctx = makeCtx({ req: { url: "https://example.com/?code=1&state=abc" } });
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue(asString("good"));
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed(
				asFetchUserResult({
					supabase: fakeSupabase,
					oauthUserData: { email: "x" },
					existingUser: undefined,
				}),
			),
		);

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		const text = await resp.text();
		expect(text).toBe("reg");
		expect(mockedHandleRegistration).toHaveBeenCalledWith(expect.anything());
	});

	it("creates session for existing user and sets cookies/redirects dashboard", async () => {
		setup();
		const ctx = makeCtx({ req: { url: "https://example.com/?code=1&state=abc" } });
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue(asString("good"));
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed(
				asFetchUserResult({
					supabase: fakeSupabase,
					oauthUserData: { email: "x" },
					existingUser: { linked_providers: ["google"] },
				}),
			),
		);

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toBe("/dash");

		const cookieHeader = getCookieHeader(ctx);
		expect(cookieHeader).toContain("userSession");
		expect(cookieHeader).toContain("csrf");
	});

	it("redirects with providerMismatch when providers differ", async () => {
		setup();
		const ctx = makeCtx({ req: { url: "https://example.com/?code=1&state=abc" } });
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "microsoft",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue(asString("good"));
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed(
				asFetchUserResult({
					supabase: fakeSupabase,
					oauthUserData: { email: "x" },
					existingUser: { linked_providers: ["google"] },
				}),
			),
		);

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("providerMismatch");
	});
});
