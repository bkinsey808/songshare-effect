import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import { ITEM_TYPES } from "@/react/tag/item-type";
import makeTagLibraryGet from "../makeTagLibraryGet.test-util";
import subscribeToTagCountsEffect from "./subscribeToTagCountsEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

const TOKEN = "test-token";
const fakeClient = forceCast<ReturnType<typeof getSupabaseClient>>({});
const fakeCleanup = vi.fn();

describe("subscribeToTagCountsEffect", () => {
	it("returns a cleanup function on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		const cleanup = await Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get));

		expect(typeof cleanup).toBe("function");
	});

	it("calls getSupabaseClient with the token from getSupabaseAuthToken", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		await Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get));

		expect(getSupabaseClient).toHaveBeenCalledWith(TOKEN);
	});

	it("creates a subscription for each of the 5 item-type junction tables", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		await Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get));

		expect(createRealtimeSubscription).toHaveBeenCalledTimes(ITEM_TYPES.length);
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "song_tag" }),
		);
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "playlist_tag" }),
		);
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "event_tag" }),
		);
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "community_tag" }),
		);
		expect(createRealtimeSubscription).toHaveBeenCalledWith(
			expect.objectContaining({ client: fakeClient, tableName: "image_tag" }),
		);
	});

	it("calling the returned cleanup invokes all 5 subscription cleanups", async () => {
		vi.resetAllMocks();
		const cleanup0 = vi.fn();
		const cleanup1 = vi.fn();
		const cleanup2 = vi.fn();
		const cleanup3 = vi.fn();
		const cleanup4 = vi.fn();
		vi.mocked(createRealtimeSubscription)
			.mockImplementationOnce(() => cleanup0)
			.mockImplementationOnce(() => cleanup1)
			.mockImplementationOnce(() => cleanup2)
			.mockImplementationOnce(() => cleanup3)
			.mockImplementationOnce(() => cleanup4);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const cleanup = await Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get));
		cleanup();

		expect(cleanup0).toHaveBeenCalledWith();
		expect(cleanup1).toHaveBeenCalledWith();
		expect(cleanup2).toHaveBeenCalledWith();
		expect(cleanup3).toHaveBeenCalledWith();
		expect(cleanup4).toHaveBeenCalledWith();
	});

	it("fails when getSupabaseAuthToken rejects", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth error"));

		await expect(
			Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get)),
		).rejects.toThrow(/auth error/);
	});

	it("fails with 'No Supabase client available' when getSupabaseClient returns undefined", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		await expect(
			Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get)),
		).rejects.toThrow(/No Supabase client available/);
	});

	it("passes an onEvent handler to each subscription", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);
		vi.mocked(createRealtimeSubscription).mockReturnValue(fakeCleanup);

		await Effect.runPromise(subscribeToTagCountsEffect(makeTagLibraryGet().get));

		for (const [config] of vi.mocked(createRealtimeSubscription).mock.calls) {
			expect(typeof forceCast<{ onEvent: unknown }>(config).onEvent).toBe("function");
		}
	});
});
