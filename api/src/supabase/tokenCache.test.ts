import { describe, expect, it } from "vitest";

import { ONE } from "@/shared/constants/shared-constants";

import {
	clearCachedClientToken,
	getCachedClientToken,
	setCachedClientToken,
	userTokenCache,
} from "./tokenCache";

/**
 * Runs the given callback and restores token cache state in a finally block.
 * Ensures each test runs with a clean cache and cleanup runs even if the test throws.
 * @param fn - The test function to run.
 * @returns void
 */
function withCleanCache(fn: () => void): void {
	try {
		fn();
	} finally {
		clearCachedClientToken();
		userTokenCache.clear();
	}
}

describe("tokenCache", () => {
	describe("client token cache", () => {
		it("returns undefined when no token cached", () => {
			withCleanCache(() => {
				const got = getCachedClientToken();
				expect(got.token).toBeUndefined();
				expect(got.expiry).toBeUndefined();
			});
		});

		it("returns cached token after setCachedClientToken", () => {
			withCleanCache(() => {
				const token = "jwt-token-123";
				const expiry = 1_700_000_000;

				setCachedClientToken(token, expiry);

				const got = getCachedClientToken();
				expect(got.token).toBe(token);
				expect(got.expiry).toBe(expiry);
			});
		});

		it("clears token after clearCachedClientToken", () => {
			withCleanCache(() => {
				setCachedClientToken("token", ONE);
				clearCachedClientToken();

				const got = getCachedClientToken();
				expect(got.token).toBeUndefined();
				expect(got.expiry).toBeUndefined();
			});
		});
	});

	describe("userTokenCache", () => {
		it("is a Map", () => {
			expect(userTokenCache).toBeInstanceOf(Map);
		});

		it("stores token and expiry by cache key", () => {
			withCleanCache(() => {
				const expiry = 1_700_000_000;
				userTokenCache.set("test-user", { token: "user-token", expiry, realtimeToken: "rt" });

				const entry = userTokenCache.get("test-user");
				expect(entry?.token).toBe("user-token");
				expect(entry?.expiry).toBe(expiry);
				expect(entry?.realtimeToken).toBe("rt");
			});
		});
	});
});
