import { describe, expect, it, vi } from "vitest";

import { apiUserTokenPath } from "@/shared/paths";
import promiseResolved from "@/shared/test-utils/promiseResolved.test-util";

import { cacheUserToken, getCachedUserToken } from "../token/token-cache";
import fetchSupabaseUserTokenFromApi from "./fetchSupabaseUserTokenFromApi";

vi.mock("../token/token-cache");

const VALID_RESPONSE = {
	success: true,
	data: { access_token: "user-tok-xyz", expires_in: 3600 },
};

describe("fetchSupabaseUserTokenFromApi", () => {
	it("returns cached token when available", async () => {
		vi.mocked(getCachedUserToken).mockReturnValue("cached-token");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const result = await fetchSupabaseUserTokenFromApi();

		expect(result).toBe("cached-token");
		expect(fetchMock).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});

	it("fetches and caches when no cached token", async () => {
		vi.mocked(getCachedUserToken).mockReturnValue(undefined);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved(VALID_RESPONSE),
			}),
		);

		const result = await fetchSupabaseUserTokenFromApi();

		expect(result).toBe("user-tok-xyz");
		expect(vi.mocked(fetch)).toHaveBeenCalledWith(
			apiUserTokenPath,
			expect.objectContaining({ method: "GET", credentials: "include" }),
		);
		expect(cacheUserToken).toHaveBeenCalledWith("user-tok-xyz", expect.any(Number));

		vi.unstubAllGlobals();
	});

	it("returns undefined when response is not ok", async () => {
		vi.clearAllMocks();
		vi.mocked(getCachedUserToken).mockReturnValue(undefined);
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		const result = await fetchSupabaseUserTokenFromApi();

		expect(result).toBeUndefined();
		expect(vi.mocked(cacheUserToken)).not.toHaveBeenCalled();

		errorSpy.mockRestore();
		vi.unstubAllGlobals();
	});

	it("returns undefined when response JSON lacks token shape", async () => {
		vi.mocked(getCachedUserToken).mockReturnValue(undefined);
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => promiseResolved({ success: true, data: {} }),
			}),
		);

		const result = await fetchSupabaseUserTokenFromApi();

		expect(result).toBeUndefined();

		vi.unstubAllGlobals();
	});
});
