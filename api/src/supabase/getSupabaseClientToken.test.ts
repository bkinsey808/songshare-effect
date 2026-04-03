import { describe, expect, it, vi } from "vitest";

import forceCast from "@/shared/test-utils/forceCast.test-util";
import { MS_PER_SECOND, ONE_HOUR_SECONDS, TOKEN_CACHE_SKEW_SECONDS } from "@/shared/constants/http";
import { TEST_VISITOR_ID } from "@/shared/test-utils/testUserConstants";

import getSupabaseClientToken from "./getSupabaseClientToken";

vi.mock("@/api/supabase/getSupabaseServerClient");
vi.mock("@/api/supabase/tokenCache");

const SUPABASE_URL = "https://test.supabase.co";
const SERVICE_KEY = "service-key";
const VISITOR_EMAIL = "visitor@test.com";
const VISITOR_PASSWORD = "visitor-pass";
const MOCK_TOKEN = "eyJ-mock-token";
const ONE = 1;

const ENV = {
	VITE_SUPABASE_URL: SUPABASE_URL,
	SUPABASE_SERVICE_KEY: SERVICE_KEY,
	SUPABASE_VISITOR_EMAIL: VISITOR_EMAIL,
	SUPABASE_VISITOR_PASSWORD: VISITOR_PASSWORD,
};

describe("getSupabaseClientToken", () => {
	it("returns cached token when still valid", async () => {
		const tokenCache = await import("@/api/supabase/tokenCache");
		const nowSec = Math.floor(Date.now() / MS_PER_SECOND);
		vi.mocked(tokenCache.getCachedClientToken).mockReturnValue({
			token: MOCK_TOKEN,
			expiry: nowSec + ONE_HOUR_SECONDS,
			realtimeToken: undefined,
		});

		const result = await getSupabaseClientToken(ENV);

		expect(result.accessToken).toBe(MOCK_TOKEN);
		expect(tokenCache.setCachedClientToken).not.toHaveBeenCalled();
	});

	it("bypasses cache when expiry is within skew window", async () => {
		const tokenCache = await import("@/api/supabase/tokenCache");
		const getSupabaseServerClient = await import("@/api/supabase/getSupabaseServerClient");
		const nowSec = Math.floor(Date.now() / MS_PER_SECOND);
		vi.mocked(tokenCache.getCachedClientToken).mockReturnValue({
			token: MOCK_TOKEN,
			expiry: nowSec + TOKEN_CACHE_SKEW_SECONDS - ONE,
			realtimeToken: undefined,
		});

		const signInWithPassword = vi.fn().mockResolvedValue({
			data: {
				session: {
					access_token: MOCK_TOKEN,
					expires_at: nowSec + ONE_HOUR_SECONDS,
				},
				user: { id: TEST_VISITOR_ID, app_metadata: { visitor_id: TEST_VISITOR_ID } },
			},
			error: undefined,
		});
		vi.mocked(getSupabaseServerClient.default).mockReturnValue(
			forceCast({ auth: { signInWithPassword } }),
		);

		const result = await getSupabaseClientToken(ENV);

		expect(result.accessToken).toBe(MOCK_TOKEN);
		expect(signInWithPassword).toHaveBeenCalledWith({
			email: VISITOR_EMAIL,
			password: VISITOR_PASSWORD,
		});
	});
});
