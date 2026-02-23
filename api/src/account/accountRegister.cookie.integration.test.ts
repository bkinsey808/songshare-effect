import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";
import { describe, expect, it, vi } from "vitest";

import { userSessionCookieName } from "@/api/cookie/cookie";
import { parseDataFromCookie } from "@/api/cookie/parseDataFromCookie";
import makeCtx from "@/api/hono/makeCtx.test-util";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";
import { csrfTokenCookieName } from "@/shared/cookies";

import accountRegister from "./accountRegister";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/parseDataFromCookie");
vi.mock("hono/jwt");
vi.mock("nanoid");

const SAMPLE_USER_ID = "00000000-0000-4000-8000-000000000001";
const RAW_INSERTED_USER = {
	user_id: SAMPLE_USER_ID,
	email: "u@example.com",
	name: "Test User",
	sub: "sub-1",
	linked_providers: ["google"],
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
	google_calendar_access: "none",
	role: "user",
} as const;

describe("accountRegister cookie integration", () => {
	it("appends a secure, HttpOnly session cookie (production)", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: {
				VITE_SUPABASE_URL: "url",
				SUPABASE_SERVICE_KEY: "svc-key",
				JWT_SECRET: "jwt-secret",
				ENVIRONMENT: "production",
				OAUTH_REDIRECT_ORIGIN: "https://app.example",
			},
			resHeadersAppend: appendSpy,
		});

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com", name: "Test User", sub: "sub-1" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		const res = await Effect.runPromise(accountRegister(ctx));
		expect(res).toStrictEqual({ success: true });

		// Collect cookie header values
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only cast from Vitest mock calls
		const cookieCalls = appendSpy.mock.calls as unknown as [string, string][];
		const cookieHeaders = cookieCalls.map(([_name, headerValue]) => headerValue);
		const sessionHeader = cookieHeaders.find((header) =>
			header.includes(`${userSessionCookieName}=`),
		);

		expect(sessionHeader).toBeDefined();
		expect(sessionHeader).toContain("session-jwt");
		expect(sessionHeader).toContain("HttpOnly;");
		expect(sessionHeader).toContain("Secure;");
	});

	it("appends a readable csrf cookie (production)", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: {
				VITE_SUPABASE_URL: "url",
				SUPABASE_SERVICE_KEY: "svc-key",
				JWT_SECRET: "jwt-secret",
				ENVIRONMENT: "production",
				OAUTH_REDIRECT_ORIGIN: "https://app.example",
			},
			resHeadersAppend: appendSpy,
		});

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com", name: "Test User", sub: "sub-1" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		const res = await Effect.runPromise(accountRegister(ctx));
		expect(res).toStrictEqual({ success: true });

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only cast from Vitest mock calls
		const cookieCalls = appendSpy.mock.calls as unknown as [string, string][];
		const cookieHeaders = cookieCalls.map(([_name, headerValue]) => headerValue);
		const csrfHeader = cookieHeaders.find((header) => header.includes(`${csrfTokenCookieName}=`));

		expect(csrfHeader).toBeDefined();
		expect(csrfHeader).toContain("csrf-token");
		// csrf cookie is readable by JS (httpOnly: false)
		expect(csrfHeader).not.toContain("HttpOnly;");
	});

	it("produces non-secure SameSite=Lax cookie when request URL is non-https", async () => {
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({
			body: { username: "intuser" },
			env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key", JWT_SECRET: "jwt-secret" },
			resHeadersAppend: appendSpy,
		});

		// Force non-https request URL (test-only cast)
		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only
		(ctx.req as unknown as { url: string }).url = "http://example.test/api/test";

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com", name: "Test User", sub: "sub-1" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		const typedFakeClient = makeSupabaseClient({
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "intuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});
		vi.mocked(createClient).mockReturnValue(typedFakeClient);

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(nanoid).mockReturnValue("csrf-token");

		const res = await Effect.runPromise(accountRegister(ctx));
		expect(res).toStrictEqual({ success: true });

		// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- test-only cast from Vitest mock calls
		const cookieCalls = appendSpy.mock.calls as unknown as [string, string][];
		const cookieHeaders = cookieCalls.map(([_name, headerValue]) => headerValue);
		const sessionCookie = cookieHeaders.find((header) =>
			header.includes(`${userSessionCookieName}=`),
		);
		expect(sessionCookie).toBeDefined();
		expect(sessionCookie).toContain("SameSite=Lax;");
		expect(sessionCookie).not.toContain("Secure;");
	});
});
