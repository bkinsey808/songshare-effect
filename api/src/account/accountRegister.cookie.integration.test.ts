import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";
import { describe, expect, it, vi } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";
import getCookieHeaders from "@/api/cookie/getCookieHeaders.test-util";
import { parseDataFromCookie } from "@/api/cookie/parseDataFromCookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.test-util";
import { csrfTokenCookieName } from "@/shared/cookies";
import makeOauthState from "@/shared/test-utils/makeOauthState.test-util";
import makeOauthUserData from "@/shared/test-utils/makeOauthUserData.test-util";
import makeUser from "@/shared/test-utils/makeUser.test-util";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import accountRegister from "./accountRegister";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/parseDataFromCookie");
vi.mock("hono/jwt");
vi.mock("nanoid");

const SAMPLE_USER_ID = TEST_USER_ID;
const RAW_INSERTED_USER = makeUser({
	user_id: SAMPLE_USER_ID,
	sub: "sub-1",
	linked_providers: ["google"],
});

describe("accountRegister cookie integration", () => {
	it("appends a secure, HttpOnly session cookie (production)", async () => {
		// Arrange
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: {
				VITE_SUPABASE_URL: "url",
				SUPABASE_SERVICE_KEY: "svc-key",
				SUPABASE_JWT_SECRET: "jwt-secret",
				ENVIRONMENT: "production",
				OAUTH_REDIRECT_ORIGIN: "https://app.example",
			},
			resHeadersAppend: appendSpy,
		});

		vi.mocked(parseDataFromCookie).mockReturnValueOnce(
			Effect.succeed({
				oauthUserData: makeOauthUserData(),
				oauthState: makeOauthState(),
			}),
		);

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		// Act
		const res = await Effect.runPromise(accountRegister(ctx));

		// Assert
		expect(res).toStrictEqual({ success: true });

		// Collect cookie header values
		const cookieHeaders = getCookieHeaders(appendSpy);
		const sessionHeader = cookieHeaders.find((header: string) =>
			header.includes(`${userSessionCookieName}=`),
		);

		expect(sessionHeader).toBeDefined();
		expect(sessionHeader).toContain("session-jwt");
		expect(sessionHeader).toContain("HttpOnly;");
		expect(sessionHeader).toContain("Secure;");
	});

	it("appends a readable csrf cookie (production)", async () => {
		// Arrange
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: {
				VITE_SUPABASE_URL: "url",
				SUPABASE_SERVICE_KEY: "svc-key",
				SUPABASE_JWT_SECRET: "jwt-secret",
				ENVIRONMENT: "production",
				OAUTH_REDIRECT_ORIGIN: "https://app.example",
			},
			resHeadersAppend: appendSpy,
		});

		vi.mocked(parseDataFromCookie).mockReturnValueOnce(
			Effect.succeed({
				oauthUserData: makeOauthUserData(),
				oauthState: makeOauthState(),
			}),
		);

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		// Act
		const res = await Effect.runPromise(accountRegister(ctx));

		// Assert
		expect(res).toStrictEqual({ success: true });

		const cookieHeaders = getCookieHeaders(appendSpy);
		const csrfHeader = cookieHeaders.find((header: string) =>
			header.includes(`${csrfTokenCookieName}=`),
		);

		expect(csrfHeader).toBeDefined();
		expect(csrfHeader).toContain("csrf-token");
		// csrf cookie is readable by JS (httpOnly: false)
		expect(csrfHeader).not.toContain("HttpOnly;");
	});

	it("produces non-secure SameSite=Lax cookie when request URL is non-https", async () => {
		// Arrange
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: {
				VITE_SUPABASE_URL: "url",
				SUPABASE_SERVICE_KEY: "svc-key",
				SUPABASE_JWT_SECRET: "jwt-secret",
			},
			resHeadersAppend: appendSpy,
			req: { url: "http://example.test/api/test" },
		});

		vi.mocked(parseDataFromCookie).mockReturnValueOnce(
			Effect.succeed({
				oauthUserData: makeOauthUserData(),
				oauthState: makeOauthState(),
			}),
		);

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		// Act
		const res = await Effect.runPromise(accountRegister(ctx));

		// Assert
		expect(res).toStrictEqual({ success: true });

		const cookieHeaders = getCookieHeaders(appendSpy);
		const sessionCookie = cookieHeaders.find((header: string) =>
			header.includes(`${userSessionCookieName}=`),
		);
		expect(sessionCookie).toBeDefined();
		expect(sessionCookie).toContain("SameSite=Lax;");
		expect(sessionCookie).not.toContain("Secure;");
	});
});
