import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import { HTTP_BAD_REQUEST } from "@/shared/constants/http";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import exchangeCodeForToken from "./exchangeCodeForToken";

const TOKEN_URL = "https://auth.example.com/token";
const REDIRECT_URI = "https://app.example.com/callback";
const CODE = "auth-code-123";

describe("exchangeCodeForToken", () => {
	it("returns access_token and id_token when both present", async () => {
		const tokenResponse = {
			access_token: "at-123",
			id_token: "id-456",
		};
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				promiseResolved({
					ok: true,
					json: (): Promise<typeof tokenResponse> => promiseResolved(tokenResponse),
				}),
			),
		);
		try {
			const result = await Effect.runPromise(
				exchangeCodeForToken({
					accessTokenUrl: TOKEN_URL,
					redirectUri: REDIRECT_URI,
					code: CODE,
					userInfoUrl: "https://auth.example.com/userinfo",
				}),
			);
			expect(result).toMatchObject({
				accessToken: "at-123",
				idToken: "id-456",
			});
			expect(result.raw).toStrictEqual(tokenResponse);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("sends correct request to token endpoint", async () => {
		const tokenResponse = { access_token: "at" };
		let capturedInit: RequestInit | undefined = undefined;
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn((url: string, init?: RequestInit) => {
				expect(url).toBe(TOKEN_URL);
				capturedInit = init;
				return Promise.resolve({
					ok: true,
					json: (): Promise<typeof tokenResponse> => promiseResolved(tokenResponse),
				});
			}),
		);
		try {
			await Effect.runPromise(
				exchangeCodeForToken({
					accessTokenUrl: TOKEN_URL,
					redirectUri: REDIRECT_URI,
					code: CODE,
					userInfoUrl: "https://auth.example.com/userinfo",
				}),
			);
			expect(capturedInit).toBeDefined();
			const init = forceCast<RequestInit>(capturedInit);
			const headers = forceCast<Headers>(init.headers);
			const body = forceCast<string>(init.body);
			const hasGrant = body.includes("grant_type=authorization_code");
			const hasCode = body.includes(`code=${encodeURIComponent(CODE)}`);
			const hasRedirect = body.includes(`redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
			expect({
				method: init.method,
				contentType: headers.get("Content-Type"),
				accept: headers.get("Accept"),
				hasGrant,
				hasCode,
				hasRedirect,
			}).toStrictEqual({
				method: "POST",
				contentType: "application/x-www-form-urlencoded",
				accept: "application/json",
				hasGrant: true,
				hasCode: true,
				hasRedirect: true,
			});
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("includes client_id and client_secret when provided", async () => {
		const tokenResponse = { access_token: "at" };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn((_url: string, init?: RequestInit) => {
				expect(init).toBeDefined();
				const body = forceCast<string>(forceCast<RequestInit>(init).body);
				expect(body).toContain("client_id=my-client");
				expect(body).toContain("client_secret=my-secret");
				return Promise.resolve({
					ok: true,
					json: (): Promise<typeof tokenResponse> => promiseResolved(tokenResponse),
				});
			}),
		);
		try {
			const result = await Effect.runPromise(
				exchangeCodeForToken({
					accessTokenUrl: TOKEN_URL,
					redirectUri: REDIRECT_URI,
					code: CODE,
					clientId: "my-client",
					clientSecret: "my-secret",
					userInfoUrl: "https://auth.example.com/userinfo",
				}),
			);
			expect(result.accessToken).toBe("at");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("fails when response is not ok", async () => {
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: HTTP_BAD_REQUEST,
				text: () => promiseResolved("invalid_grant"),
			}),
		);
		try {
			await expect(
				Effect.runPromise(
					exchangeCodeForToken({
						accessTokenUrl: TOKEN_URL,
						redirectUri: REDIRECT_URI,
						code: CODE,
						userInfoUrl: "https://auth.example.com/userinfo",
					}),
				),
			).rejects.toThrow(new RegExp(`Token exchange failed: ${HTTP_BAD_REQUEST}`));
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("fails when response JSON is invalid", async () => {
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved(undefined as unknown),
			}),
		);
		try {
			await expect(
				Effect.runPromise(
					exchangeCodeForToken({
						accessTokenUrl: TOKEN_URL,
						redirectUri: REDIRECT_URI,
						code: CODE,
						userInfoUrl: "https://auth.example.com/userinfo",
					}),
				),
			).rejects.toThrow("Token exchange returned invalid JSON");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
