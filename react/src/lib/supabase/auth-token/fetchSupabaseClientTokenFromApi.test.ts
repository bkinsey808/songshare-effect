import { type Mock, describe, expect, it, vi } from "vitest";

import { apiAuthVisitorPath } from "@/shared/paths";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import { cacheSupabaseClientToken } from "../token/token-cache";
import fetchSupabaseClientTokenFromApi from "./fetchSupabaseClientTokenFromApi";

vi.mock("../token/token-cache", (): { cacheSupabaseClientToken: Mock } => ({
	cacheSupabaseClientToken: vi.fn(),
}));

const VALID_TOKEN_RESPONSE = {
	access_token: "tok-xyz",
	token_type: "Bearer",
	expires_in: 3600,
};

describe("fetchSupabaseClientTokenFromApi", () => {
	it("returns access_token when response is ok and valid", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: (): Promise<typeof VALID_TOKEN_RESPONSE> => promiseResolved(VALID_TOKEN_RESPONSE),
			}),
		);

		const result = await fetchSupabaseClientTokenFromApi();

		expect(result).toBe("tok-xyz");
		expect(fetch).toHaveBeenCalledWith(apiAuthVisitorPath);
		expect(cacheSupabaseClientToken).toHaveBeenCalledWith(
			VALID_TOKEN_RESPONSE.access_token,
			expect.any(Number),
		);
		vi.unstubAllGlobals();
	});

	it("throws when response is not ok", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
			}),
		);
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		await expect(fetchSupabaseClientTokenFromApi()).rejects.toThrow(
			"Unable to authenticate as visitor",
		);
		errorSpy.mockRestore();
		vi.unstubAllGlobals();
	});

	it("throws when response JSON is not valid token shape", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: (): Promise<Record<string, unknown>> => promiseResolved({}),
			}),
		);
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		await expect(fetchSupabaseClientTokenFromApi()).rejects.toThrow(
			"Unable to authenticate as visitor",
		);
		errorSpy.mockRestore();
		vi.unstubAllGlobals();
	});

	it("throws when fetch rejects", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		await expect(fetchSupabaseClientTokenFromApi()).rejects.toThrow(
			"Unable to authenticate as visitor",
		);
		errorSpy.mockRestore();
		vi.unstubAllGlobals();
	});
});
