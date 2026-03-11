import { describe, expect, it, vi } from "vitest";

import {
	cacheSupabaseClientToken,
	cacheUserToken,
	clearSupabaseClientToken,
	clearUserToken,
	getCachedSupabaseClientToken,
	getCachedUserToken,
	isUserSignedIn,
} from "./token-cache";

const TOKEN_A = "token-a";
const TOKEN_B = "token-b";
const BUFFER_MINUTES = 5;
const MINUTES_TO_SECONDS = 60;
const MS_PER_SEC = 1000;
const BUFFER_MS = BUFFER_MINUTES * MINUTES_TO_SECONDS * MS_PER_SEC;
const NOW = 1_000_000;
const ONE_MS = 1;
const HALF_DIVISOR = 2;

function withFakeTimers(fn: () => void): void {
	vi.useFakeTimers();
	try {
		fn();
	} finally {
		vi.useRealTimers();
	}
}

describe("token-cache", () => {
	describe("getCachedUserToken", () => {
		it("returns undefined when no token is cached", () => {
			clearUserToken();
			clearSupabaseClientToken();
			expect(getCachedUserToken()).toBeUndefined();
		});

		it("returns token when cached and not expired", () => {
			withFakeTimers(() => {
				clearUserToken();
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheUserToken(TOKEN_A, NOW + BUFFER_MS + ONE_MS);

				expect(getCachedUserToken()).toBe(TOKEN_A);
			});
		});

		it("returns undefined when token has expired", () => {
			withFakeTimers(() => {
				clearUserToken();
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheUserToken(TOKEN_A, NOW - ONE_MS);

				expect(getCachedUserToken()).toBeUndefined();
			});
		});

		it("returns undefined and clears cache when within buffer window", () => {
			withFakeTimers(() => {
				clearUserToken();
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheUserToken(TOKEN_A, NOW + BUFFER_MS / HALF_DIVISOR);

				expect(getCachedUserToken()).toBeUndefined();
				expect(getCachedUserToken()).toBeUndefined();
			});
		});
	});

	describe("cacheUserToken", () => {
		it("clears client token when user token is cached", () => {
			clearUserToken();
			clearSupabaseClientToken();
			withFakeTimers(() => {
				vi.setSystemTime(NOW);
				cacheSupabaseClientToken(TOKEN_B, NOW + BUFFER_MS + ONE_MS);
				cacheUserToken(TOKEN_A, NOW + BUFFER_MS + ONE_MS);

				expect(getCachedSupabaseClientToken()).toBeUndefined();
				expect(getCachedUserToken()).toBe(TOKEN_A);
			});
		});
	});

	describe("clearUserToken", () => {
		it("clears cached user token", () => {
			withFakeTimers(() => {
				clearUserToken();
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheUserToken(TOKEN_A, NOW + BUFFER_MS + ONE_MS);
				expect(getCachedUserToken()).toBe(TOKEN_A);

				clearUserToken();
				expect(getCachedUserToken()).toBeUndefined();
			});
		});
	});

	describe("getCachedSupabaseClientToken", () => {
		it("returns undefined when no token is cached", () => {
			clearSupabaseClientToken();
			expect(getCachedSupabaseClientToken()).toBeUndefined();
		});

		it("returns token when cached and not expired", () => {
			withFakeTimers(() => {
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheSupabaseClientToken(TOKEN_B, NOW + BUFFER_MS + ONE_MS);

				expect(getCachedSupabaseClientToken()).toBe(TOKEN_B);
			});
		});

		it("returns undefined when token has expired", () => {
			withFakeTimers(() => {
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheSupabaseClientToken(TOKEN_B, NOW - ONE_MS);

				expect(getCachedSupabaseClientToken()).toBeUndefined();
			});
		});
	});

	describe("isUserSignedIn", () => {
		it("returns false when no user token cached", () => {
			clearUserToken();
			expect(isUserSignedIn()).toBe(false);
		});

		it("returns true when valid user token cached", () => {
			withFakeTimers(() => {
				clearUserToken();
				clearSupabaseClientToken();
				vi.setSystemTime(NOW);
				cacheUserToken(TOKEN_A, NOW + BUFFER_MS + ONE_MS);

				expect(isUserSignedIn()).toBe(true);
			});
		});
	});
});
