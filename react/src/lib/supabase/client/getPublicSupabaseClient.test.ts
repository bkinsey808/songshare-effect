import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { getEnvValueSafe } from "@/react/lib/utils/env";

import getPublicSupabaseClient from "./getPublicSupabaseClient";
import makeFakeSupabaseClient from "./test-utils";

// mocks --------------------------------------------------------------------
vi.mock("@supabase/supabase-js");
vi.mock("@/react/lib/utils/env");

const mockCreateClient = vi.mocked(createClient);
const mockGetEnv = vi.mocked(getEnvValueSafe);

// tests --------------------------------------------------------------------

describe("getPublicSupabaseClient", () => {
	/**
	 * Helper that resets mocks and provides a simple env map implementation.
	 *
	 * Using an object lookup avoids conditionals inside test code which eslint
	 * flags.  Each test can call this with different values instead of
	 * relying on jest hooks.
	 */
	function setupEnv(url?: string, anon?: string): void {
		vi.resetAllMocks();
		const envMap: Record<string, string | undefined> = {
			SUPABASE_URL: url,
			SUPABASE_ANON_KEY: anon,
		};
		mockGetEnv.mockImplementation((name: string) => envMap[name]);
	}

	it("returns undefined when SUPABASE_URL is missing", () => {
		setupEnv(undefined, "some-key");

		expect(getPublicSupabaseClient()).toBeUndefined();
		expect(mockCreateClient).not.toHaveBeenCalled();
	});

	it("returns undefined when SUPABASE_ANON_KEY is missing", () => {
		setupEnv("https://foo", undefined);

		expect(getPublicSupabaseClient()).toBeUndefined();
		expect(mockCreateClient).not.toHaveBeenCalled();
	});

	it("creates and returns a client when both env vars are provided", () => {
		setupEnv("https://supabase.test", "anon-123");

		const fake = makeFakeSupabaseClient();
		mockCreateClient.mockReturnValue(fake);

		const result = getPublicSupabaseClient();
		expect(result).toBe(fake);
		expect(mockCreateClient).toHaveBeenCalledWith("https://supabase.test", "anon-123", {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false,
			},
		});
	});
});
