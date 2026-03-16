import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { HTTP_UNAUTHORIZED } from "@/shared/constants/http";
import promiseResolved, { promiseRejected } from "@/shared/test-utils/promiseResolved.test-util";

import fetchUserInfo from "./fetchUserInfo";

const USERINFO_URL = "https://auth.example.com/userinfo";

describe("fetchUserInfo", () => {
	it("returns parsed JSON when response is ok, using accessToken when provided", async () => {
		const userInfo = { sub: "user-1", name: "Test User", email: "test@example.com" };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn((url: string, init?: RequestInit) => {
				expect(url).toBe(USERINFO_URL);
				const headers = forceCast<Headers | undefined>(init?.headers);
				expect(headers?.get("Authorization")).toBe("Bearer at-123");
				expect(headers?.get("Accept")).toBe("application/json");
				return Promise.resolve({
					ok: true,
					json: (): Promise<typeof userInfo> => promiseResolved(userInfo),
				});
			}),
		);
		try {
			const result = await Effect.runPromise(
				fetchUserInfo({
					userInfoUrl: USERINFO_URL,
					accessToken: "at-123",
				}),
			);
			expect(result).toStrictEqual(userInfo);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("uses idToken when accessToken not provided", async () => {
		const userInfo = { sub: "user-1" };
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn((_url: string, init?: RequestInit) => {
				const headers = forceCast<Headers | undefined>(init?.headers);
				expect(headers?.get("Authorization")).toBe("Bearer id-456");
				return Promise.resolve({
					ok: true,
					json: (): Promise<typeof userInfo> => promiseResolved(userInfo),
				});
			}),
		);
		try {
			const result = await Effect.runPromise(
				fetchUserInfo({
					userInfoUrl: USERINFO_URL,
					idToken: "id-456",
				}),
			);
			expect(result).toStrictEqual(userInfo);
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
				status: HTTP_UNAUTHORIZED,
				text: () => promiseResolved("Unauthorized"),
			}),
		);
		try {
			await expect(
				Effect.runPromise(
					fetchUserInfo({
						userInfoUrl: USERINFO_URL,
						accessToken: "bad-token",
					}),
				),
			).rejects.toThrow(new RegExp(`Userinfo fetch failed: ${HTTP_UNAUTHORIZED}`));
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
				json: () => promiseRejected<unknown>(new Error("parse error")),
			}),
		);
		try {
			await expect(
				Effect.runPromise(
					fetchUserInfo({
						userInfoUrl: USERINFO_URL,
					}),
				),
			).rejects.toThrow(/Userinfo returned invalid JSON|parse error/);
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
