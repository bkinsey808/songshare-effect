/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */
// helper-specific disables are scoped below where needed
import { Effect } from "effect";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import type { ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";
import type { OauthState } from "@/shared/oauth/oauthState";

import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import computeStateRedirectUri from "@/api/oauth-callback-factory/computeStateRedirectUri";
import rateLimit from "@/api/oauth-callback-factory/rateLimit";
import handleRegistration from "@/api/oauth-callback-factory/registrationRedirect";
import buildDashboardRedirectUrl from "@/api/oauth/buildDashboardRedirectUrl";
import fetchAndPrepareUser from "@/api/oauth/fetchAndPrepareUser";
// helper for creating minimal fake Supabase clients in tests
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import buildUserSessionJwt from "@/api/user-session/buildUserSessionJwt";

import oauthCallbackFactory from "./oauthCallbackFactory";
import { SEE_OTHER } from "./registrationRedirect";

// share a fake client instance across tests; util handles typing
const fakeSupabase = makeSupabaseClient();

// mock every external dependency so tests can control their return values
// using untyped factories is convenient here; enable only for this block
/* eslint-disable jest/no-untyped-mock-factory */
vi.mock("@/api/oauth-callback-factory/rateLimit", () => ({ default: vi.fn() }));
vi.mock("hono/jwt", () => ({ verify: vi.fn() }));
vi.mock("@/api/oauth-callback-factory/computeStateRedirectUri", () => ({ default: vi.fn() }));
vi.mock("@/api/oauth-callback-factory/registrationRedirect", () => ({
	default: vi.fn(),
	SEE_OTHER: 303,
}));
vi.mock("@/api/oauth/fetchAndPrepareUser", () => ({ default: vi.fn() }));
vi.mock("@/api/user-session/buildUserSessionJwt", () => ({ default: vi.fn() }));
vi.mock("@/api/cookie/buildSessionCookie", () => ({ default: vi.fn() }));
vi.mock("@/api/oauth/buildDashboardRedirectUrl", () => ({ default: vi.fn() }));
vi.mock("hono/cookie", () => ({ getCookie: vi.fn() }));
/* eslint-enable jest/no-untyped-mock-factory */

const mockedRateLimit = vi.mocked(rateLimit);
const mockedVerify = vi.mocked(verify);
const mockedComputeStateRedirectUri = vi.mocked(computeStateRedirectUri);
const mockedHandleRegistration = vi.mocked(handleRegistration);
const mockedFetchAndPrepareUser = vi.mocked(fetchAndPrepareUser);
const mockedBuildUserSessionJwt = vi.mocked(buildUserSessionJwt);
const mockedBuildSessionCookie = vi.mocked(buildSessionCookie);
const mockedBuildDashboardRedirectUrl = vi.mocked(buildDashboardRedirectUrl);
const mockedGetCookie = vi.mocked(getCookie);

// small fake context that satisfies the factory's usage
// only fields used by oauthCallbackFactory
type FakeCtx = {
	res: { headers: Headers };
	env: unknown;
	req: { header: () => string; url: string };
	redirect: (loc: string, status?: number) => Response;
};

// minimal success payload type for our fetchAndPrepareUser stub
// matches the real helper's output shape (supabase client is opaque)
type FetchUserResult = {
	supabase: ReadonlySupabaseClient;
	oauthUserData: { email: string };
	existingUser: { linked_providers: string[] } | undefined;
};

function makeCtx(url = "https://example.com/", env?: unknown): FakeCtx {
	// avoid object literal default in parameter to satisfy lint
	const envVal = env ?? { STATE_HMAC_SECRET: "test" };
	const headers = new Headers();
	/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
	return {
		res: { headers },
		env: envVal,
		req: { header: () => "", url },
		redirect: (loc: string, status = SEE_OTHER) =>
			new Response(undefined, { status, headers: { Location: loc } }),
	};
	/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
}

function getCookieHeader(ctx: FakeCtx): string | null {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
	return ctx.res.headers.get("Set-Cookie");
}

// helper to reset mocks and set defaults (no hooks)
function setup(): void {
	vi.clearAllMocks();
	// default mocks
	mockedRateLimit.mockResolvedValue(true);
	// provide minimal valid state so no assertion is needed
	mockedVerify.mockResolvedValue({
		csrf: "",
		lang: "en",
		provider: "google",
		redirect_port: "",
		redirect_origin: "",
	} as OauthState);
	mockedComputeStateRedirectUri.mockReturnValue("https://callback");
	mockedHandleRegistration.mockImplementation(() =>
		Effect.succeed(new Response("reg", { status: SEE_OTHER })),
	);
	mockedFetchAndPrepareUser.mockResolvedValue(
		Effect.succeed<FetchUserResult, never>({
			supabase: fakeSupabase,
			oauthUserData: { email: "x" },
			existingUser: { linked_providers: ["google"] },
		}),
	);
	mockedBuildUserSessionJwt.mockImplementation(() => Effect.succeed("jwt"));
	mockedBuildSessionCookie.mockImplementation(({ name }: { name: string }) => `${name}=val`);
	mockedBuildDashboardRedirectUrl.mockReturnValue("/dash");
	mockedGetCookie.mockReturnValue(undefined);
}

describe("oauthCallbackFactory", () => {
	it("redirects when rate limit disallows", async () => {
		setup();
		mockedRateLimit.mockResolvedValue(false);
		const ctx = makeCtx("https://example.com/?code=1&state=2");
		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("rateLimit");
	});

	it("handles missing code or state", async () => {
		setup();
		const ctx = makeCtx("https://example.com/");

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("missingData");
	});

	it("fails CSRF validation when cookie doesn't match", async () => {
		setup();
		const ctx = makeCtx("https://example.com/?code=1&state=2");

		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue("bad");
		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("securityFailed");
	});

	it("delegates to handleRegistration when user is new", async () => {
		setup();
		const ctx = makeCtx("https://example.com/?code=1&state=abc");
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue("good");
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed<FetchUserResult, never>({
				supabase: fakeSupabase,
				oauthUserData: { email: "x" },
				existingUser: undefined,
			}),
		);

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		const text = await resp.text();
		expect(text).toBe("reg");
		expect(mockedHandleRegistration).toHaveBeenCalledWith(expect.anything());
	});

	it("creates session for existing user and sets cookies/redirects dashboard", async () => {
		setup();
		const ctx = makeCtx("https://example.com/?code=1&state=abc");
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "google",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue("good");
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed<FetchUserResult, never>({
				supabase: fakeSupabase,
				oauthUserData: { email: "x" },
				existingUser: { linked_providers: ["google"] },
			}),
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
		const ctx = makeCtx("https://example.com/?code=1&state=abc");
		const oauthState: OauthState = {
			csrf: "good",
			lang: "en",
			provider: "microsoft",
			redirect_port: "",
			redirect_origin: "",
		};
		mockedVerify.mockResolvedValue(oauthState);
		mockedGetCookie.mockReturnValue("good");
		mockedFetchAndPrepareUser.mockImplementation(() =>
			Effect.succeed<FetchUserResult, never>({
				supabase: fakeSupabase,
				oauthUserData: { email: "x" },
				existingUser: { linked_providers: ["google"] },
			}),
		);

		const resp = await Effect.runPromise(oauthCallbackFactory(ctx));
		expect(resp.status).toBe(SEE_OTHER);
		expect(resp.headers.get("Location")).toContain("providerMismatch");
	});
});
