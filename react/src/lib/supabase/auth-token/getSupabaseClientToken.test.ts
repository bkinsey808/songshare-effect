import { describe, expect, it, vi } from "vitest";

import { cacheSupabaseClientToken, clearSupabaseClientToken } from "../token/token-cache";
import fetchSupabaseClientTokenFromApi from "./fetchSupabaseClientTokenFromApi";
import getSupabaseClientToken from "./getSupabaseClientToken";

vi.mock("./fetchSupabaseClientTokenFromApi");

const TOKEN = "visitor-token-xyz";
const BUFFER_MINUTES = 5;
const MINUTES_TO_SECONDS = 60;
const MS_PER_SEC = 1000;
const BUFFER_MS = BUFFER_MINUTES * MINUTES_TO_SECONDS * MS_PER_SEC;
const NOW = 1_000_000;
const ONE_MS = 1;

describe("getSupabaseClientToken", () => {
	it("returns cached token when available and not expired", async () => {
		vi.useFakeTimers();
		clearSupabaseClientToken();
		vi.setSystemTime(NOW);
		cacheSupabaseClientToken(TOKEN, NOW + BUFFER_MS + ONE_MS);

		const result = await getSupabaseClientToken();

		expect(result).toBe(TOKEN);
		expect(fetchSupabaseClientTokenFromApi).not.toHaveBeenCalled();

		vi.useRealTimers();
	});

	it("fetches from API when cache is empty", async () => {
		vi.mocked(fetchSupabaseClientTokenFromApi).mockResolvedValue(TOKEN);
		clearSupabaseClientToken();

		const result = await getSupabaseClientToken();

		expect(result).toBe(TOKEN);
		expect(fetchSupabaseClientTokenFromApi).toHaveBeenCalledWith();
	});

	it("fetches from API when cached token expired", async () => {
		vi.useFakeTimers();
		clearSupabaseClientToken();
		vi.setSystemTime(NOW);
		cacheSupabaseClientToken(TOKEN, NOW - ONE_MS);

		vi.mocked(fetchSupabaseClientTokenFromApi).mockResolvedValue("new-token");

		const result = await getSupabaseClientToken();

		expect(result).toBe("new-token");
		expect(fetchSupabaseClientTokenFromApi).toHaveBeenCalledWith();

		vi.useRealTimers();
	});
});
