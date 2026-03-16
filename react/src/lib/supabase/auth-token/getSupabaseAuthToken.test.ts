import { describe, expect, it, vi } from "vitest";

import { cacheUserToken, clearSupabaseClientToken, clearUserToken } from "../token/token-cache";
import fetchSupabaseUserTokenFromApi from "./fetchSupabaseUserTokenFromApi";
import getSupabaseAuthToken from "./getSupabaseAuthToken";
import getSupabaseClientToken from "./getSupabaseClientToken";

vi.mock("./fetchSupabaseUserTokenFromApi");
vi.mock("./getSupabaseClientToken");

const USER_TOKEN = "user-token-xyz";
const VISITOR_TOKEN = "visitor-token-xyz";
const BUFFER_MINUTES = 5;
const MINUTES_TO_SECONDS = 60;
const MS_PER_SEC = 1000;
const BUFFER_MS = BUFFER_MINUTES * MINUTES_TO_SECONDS * MS_PER_SEC;
const NOW = 1_000_000;
const ONE_MS = 1;

describe("getSupabaseAuthToken", () => {
	it("returns cached user token when available", async () => {
		vi.useFakeTimers();
		clearUserToken();
		clearSupabaseClientToken();
		vi.setSystemTime(NOW);
		cacheUserToken(USER_TOKEN, NOW + BUFFER_MS + ONE_MS);

		const result = await getSupabaseAuthToken();

		expect(result).toBe(USER_TOKEN);
		expect(fetchSupabaseUserTokenFromApi).not.toHaveBeenCalled();
		expect(getSupabaseClientToken).not.toHaveBeenCalled();

		vi.useRealTimers();
	});

	it("returns fetched user token when cache empty and API returns token", async () => {
		clearUserToken();
		clearSupabaseClientToken();
		vi.mocked(fetchSupabaseUserTokenFromApi).mockResolvedValue(USER_TOKEN);

		const result = await getSupabaseAuthToken();

		expect(result).toBe(USER_TOKEN);
		expect(getSupabaseClientToken).not.toHaveBeenCalled();
	});

	it("falls back to visitor client token when no user token", async () => {
		clearUserToken();
		clearSupabaseClientToken();
		vi.mocked(fetchSupabaseUserTokenFromApi).mockResolvedValue(undefined);
		vi.mocked(getSupabaseClientToken).mockResolvedValue(VISITOR_TOKEN);

		const result = await getSupabaseAuthToken();

		expect(result).toBe(VISITOR_TOKEN);
		expect(getSupabaseClientToken).toHaveBeenCalledWith();
	});
});
