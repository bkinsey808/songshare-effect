import { describe, expect, it, vi } from "vitest";

import { makeCtxWithJsonResponse } from "@/api/hono/makeCtx.test-util";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import forceCast from "@/shared/test-utils/forceCast.test-util";
import { HTTP_INTERNAL, ONE_HOUR_SECONDS } from "@/shared/constants/http";

import getSupabaseClientTokenHandler from "./getSupabaseClientTokenHandler";

vi.mock("./getSupabaseClientToken");

const MOCK_TOKEN = "eyJ-mock-token";
const EXPECTED_JSON_KEYS = ["access_token", "token_type", "expires_in"];
const EXPECTED_CALL_COUNT = 1;

describe("getSupabaseClientTokenHandler", () => {
	it("returns JSON with token on success", async () => {
		const getSupabaseClientToken = await import("./getSupabaseClientToken");
		vi.mocked(getSupabaseClientToken.default).mockResolvedValue({ accessToken: MOCK_TOKEN });

		const ctx = makeCtxWithJsonResponse({
			env: {
				VITE_SUPABASE_URL: "https://test.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
				SUPABASE_VISITOR_EMAIL: "v@test.com",
				SUPABASE_VISITOR_PASSWORD: "pass",
			},
		});

		const response = await getSupabaseClientTokenHandler(forceCast<ReadonlyContext>(ctx));

		expect(response).toBeInstanceOf(Response);
		const json = await response.json();
		const record = forceCast<Record<string, unknown>>(json);
		expect(record).toHaveProperty("access_token", MOCK_TOKEN);
		expect(record).toHaveProperty("token_type", "bearer");
		expect(record).toHaveProperty("expires_in", ONE_HOUR_SECONDS);
		expect(Object.keys(record)).toHaveLength(EXPECTED_JSON_KEYS.length);
		expect(getSupabaseClientToken.default).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
	});

	it("returns 500 JSON error when getSupabaseClientToken throws", async () => {
		const getSupabaseClientToken = await import("./getSupabaseClientToken");
		vi.mocked(getSupabaseClientToken.default).mockRejectedValue(new Error("Sign-in failed"));

		const ctx = makeCtxWithJsonResponse({
			env: {
				VITE_SUPABASE_URL: "https://test.supabase.co",
				SUPABASE_SERVICE_KEY: "key",
				SUPABASE_VISITOR_EMAIL: "v@test.com",
				SUPABASE_VISITOR_PASSWORD: "pass",
			},
		});

		const response = await getSupabaseClientTokenHandler(forceCast<ReadonlyContext>(ctx));

		expect(response.status).toBe(HTTP_INTERNAL);
		const json = await response.json();
		const record = forceCast<Record<string, unknown>>(json);
		expect(record).toHaveProperty("error");
		expect(String(record.error)).toContain("Supabase client token");
	});
});
