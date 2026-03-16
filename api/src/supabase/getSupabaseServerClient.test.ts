import { type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import getSupabaseServerClient from "./getSupabaseServerClient";

const SUPABASE_URL = "https://test.supabase.co";
const SERVICE_KEY = "service-key-secret";

vi.mock("@supabase/supabase-js");

describe("getSupabaseServerClient", () => {
	it("calls createClient with url, serviceKey, and auth options", async () => {
		const { createClient } = await import("@supabase/supabase-js");
		const fakeClient = forceCast<SupabaseClient<unknown>>({});
		vi.mocked(createClient).mockReturnValue(fakeClient);

		const result = getSupabaseServerClient(SUPABASE_URL, SERVICE_KEY);

		expect(result).toBe(fakeClient);
		expect(createClient).toHaveBeenCalledWith(
			SUPABASE_URL,
			SERVICE_KEY,
			expect.objectContaining({
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			}),
		);
	});
});
