import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { TagLibrarySlice } from "../slice/TagLibrarySlice.type";
import subscribeToTagLibraryEffect from "./subscribeToTagLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

const TOKEN = "test-token";
const fakeClient = forceCast<ReturnType<typeof getSupabaseClient>>({});
const fakeCleanup = vi.fn();

function makeGet(): () => TagLibrarySlice {
	return () => forceCast<TagLibrarySlice>({});
}

describe("subscribeToTagLibraryEffect", () => {
	it("returns a cleanup function on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		const cleanup = await Effect.runPromise(subscribeToTagLibraryEffect(makeGet()));

		expect(typeof cleanup).toBe("function");
	});

	it("calls getSupabaseClient with the token from getSupabaseAuthToken", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		await Effect.runPromise(subscribeToTagLibraryEffect(makeGet()));

		expect(getSupabaseClient).toHaveBeenCalledWith(TOKEN);
	});

	it("calls createRealtimeSubscription with the tag_library table", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		await Effect.runPromise(subscribeToTagLibraryEffect(makeGet()));

		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "tag_library" }),
		);
	});

	it("calling the returned cleanup invokes the subscription cleanup", async () => {
		vi.resetAllMocks();
		const innerCleanup = vi.fn();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(innerCleanup);

		const cleanup = await Effect.runPromise(subscribeToTagLibraryEffect(makeGet()));
		cleanup();

		expect(innerCleanup).toHaveBeenCalledWith();
	});

	it("fails when getSupabaseAuthToken rejects", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth error"));

		await expect(Effect.runPromise(subscribeToTagLibraryEffect(makeGet()))).rejects.toThrow(
			/auth error/,
		);
	});

	it("fails with 'No Supabase client available' when getSupabaseClient returns undefined", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		await expect(Effect.runPromise(subscribeToTagLibraryEffect(makeGet()))).rejects.toThrow(
			/No Supabase client available/,
		);
	});
});
