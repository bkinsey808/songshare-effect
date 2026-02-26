import { Effect, type Schema } from "effect";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { describe, expect, it, vi } from "vitest";

import type { ReadonlySupabaseClient } from "@/api/supabase/ReadonlySupabaseClient.type";
import type { UserSchema } from "@/shared/generated/supabaseSchemas";
import type { OauthState } from "@/shared/oauth/oauthState";
import type { OauthUserData } from "@/shared/oauth/oauthUserData";

import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
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
/* oxlint-disable eslint-plugin-jest/no-untyped-mock-factory */
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
/* oxlint-enable eslint-plugin-jest/no-untyped-mock-factory */

const mockedRateLimit = vi.mocked(rateLimit);
const mockedVerify = vi.mocked(verify);
const mockedComputeStateRedirectUri = vi.mocked(computeStateRedirectUri);
const mockedHandleRegistration = vi.mocked(handleRegistration);
const mockedFetchAndPrepareUser = vi.mocked(fetchAndPrepareUser);
const mockedBuildUserSessionJwt = vi.mocked(buildUserSessionJwt);
const mockedBuildSessionCookie = vi.mocked(buildSessionCookie);
const mockedBuildDashboardRedirectUrl = vi.mocked(buildDashboardRedirectUrl);
const mockedGetCookie = vi.mocked(getCookie);

function getCookieHeader(ctx: ReturnType<typeof makeCtx>): string | null {
	return ctx.res.headers.get("Set-Cookie");
}

type FetchUserResult = {
	supabase: ReadonlySupabaseClient;
	oauthUserData: OauthUserData;
	existingUser: Schema.Schema.Type<typeof UserSchema> | undefined;
};

function asOauthState(val: unknown): OauthState {
	/* oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion */
	return val as OauthState;
}

function asFetchUserResult(val: unknown): FetchUserResult {
	/* oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion */
	return val as FetchUserResult;
}

function asString(val: unknown): string {
	/* oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion */
	return val as string;
}

/**
 * Provide an explicit undefined value for mocks that avoids "confusing void expression"
 * lint errors by returning a non-void type.
 */
function getMockUndefined(): string | undefined {
	return undefined;
}

// helper to reset mocks and set defaults (no hooks)
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
