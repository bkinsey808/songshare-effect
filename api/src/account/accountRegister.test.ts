import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { sign } from "hono/jwt";
import { nanoid } from "nanoid";
import { describe, expect, it, vi } from "vitest";

import buildSessionCookie from "@/api/cookie/buildSessionCookie";
import { parseDataFromCookie } from "@/api/cookie/parseDataFromCookie";
import getIpAddress from "@/api/getIpAddress";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import accountRegister from "./accountRegister";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/parseDataFromCookie");
vi.mock("@/api/cookie/buildSessionCookie");
vi.mock("@/api/getIpAddress");
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

describe("accountRegister", () => {
	it("creates user, sets cookies and returns success (happy path)", async () => {
		// Arrange
		vi.resetAllMocks();

		const appendSpy = vi.fn();
		const ctx = makeCtx({ body: { username: "freshuser" }, resHeadersAppend: appendSpy });

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com", name: "Test User", sub: "sub-1" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		const rawUserPublic = { user_id: SAMPLE_USER_ID, username: "freshuser" };

		mockCreateSupabaseClient(vi.mocked(createClient), {
			userPublicMaybe: undefined,
			userPublicInsertRows: [rawUserPublic],
			userInsertRows: [RAW_INSERTED_USER],
		});

		vi.mocked(sign).mockResolvedValue("session-jwt");
		vi.mocked(buildSessionCookie).mockImplementation(
			({ name }: { name?: string }) => `${String(name)}-cookie`,
		);
		vi.mocked(nanoid).mockReturnValue("csrf-token");
		vi.mocked(getIpAddress).mockReturnValue("127.0.0.1");

		// Act
		const res = await Effect.runPromise(accountRegister(ctx));

		// Assert
		expect(res).toStrictEqual({ success: true });
		const EXPECTED_COOKIE_COUNT = 2;
		expect(appendSpy).toHaveBeenCalledTimes(EXPECTED_COOKIE_COUNT);
		expect(vi.mocked(sign)).toHaveBeenCalledWith(expect.anything(), "jwt-secret");
		expect(vi.mocked(parseDataFromCookie)).toHaveBeenCalledWith(
			expect.objectContaining({ cookieName: "register" }),
		);
	});

	it("fails when username already exists", async () => {
		// Arrange
		const ctx = makeCtx({ body: { username: "taken" }, resHeadersAppend: vi.fn() });

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		mockCreateSupabaseClient(vi.mocked(createClient), { userPublicMaybe: { user_id: "u-exists" } });

		// Act
		const promise = Effect.runPromise(accountRegister(ctx));

		// Assert
		await expect(promise).rejects.toThrow(/Username already taken/);
	});

	it("fails when register cookie is missing or invalid", async () => {
		// Arrange
		const ctx = makeCtx({ body: { username: "freshuser" }, resHeadersAppend: vi.fn() });
		vi.mocked(parseDataFromCookie).mockResolvedValueOnce(undefined);

		// Act
		const promise = Effect.runPromise(accountRegister(ctx));

		// Assert
		await expect(promise).rejects.toThrow(/Invalid register cookie/);
	});

	it("fails with ValidationError when request JSON is invalid", async () => {
		// Arrange
		const ctx = makeCtx({ body: new Error("bad json"), resHeadersAppend: vi.fn() });

		// Act
		const promise = Effect.runPromise(accountRegister(ctx));

		// Assert
		await expect(promise).rejects.toThrow(/Invalid JSON body/);
	});

	it("fails when DB insert for user returns an error", async () => {
		// Arrange
		const ctx = makeCtx({ body: { username: "freshuser" }, resHeadersAppend: vi.fn() });

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		mockCreateSupabaseClient(vi.mocked(createClient), {
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: "u-1", username: "freshuser" }],
			userInsertError: { message: "insert failed" },
		});

		// Act
		const promise = Effect.runPromise(accountRegister(ctx));

		// Assert
		await expect(promise).rejects.toThrow(/Failed to insert user record/);
	});

	it("fails when SUPABASE_JWT_SECRET is missing (server misconfiguration)", async () => {
		// Arrange
		const ctx = makeCtx({ body: { username: "freshuser" }, env: { SUPABASE_JWT_SECRET: "" } });

		vi.mocked(parseDataFromCookie).mockResolvedValueOnce({
			oauthUserData: { email: "u@example.com" },
			oauthState: { csrf: "x", lang: "en", provider: "google" },
		});

		mockCreateSupabaseClient(vi.mocked(createClient), {
			userPublicMaybe: undefined,
			userPublicInsertRows: [{ user_id: SAMPLE_USER_ID, username: "freshuser" }],
			userInsertRows: [RAW_INSERTED_USER],
		});

		// Act
		const promise = Effect.runPromise(accountRegister(ctx));

		// Assert
		await expect(promise).rejects.toThrow(/missing SUPABASE_JWT_SECRET/);
	});
});
