import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import makeEventLibrarySlice from "../slice/makeEventLibrarySlice.mock";
import handleEventLibrarySubscribeEvent from "./handleEventLibrarySubscribeEvent";
import subscribeToEventLibraryEffect from "./subscribeToEventLibraryEffect";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("./handleEventLibrarySubscribeEvent");

describe("subscribeToEventLibraryEffect", () => {
	it("resolves to a cleanup function and wires up onEvent", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const fakeClient = createMinimalSupabaseClient();
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		let cleanupCalled = false;

		vi.mocked(createRealtimeSubscription).mockImplementation(
			({
				client,
				tableName,
				onEvent,
			}: {
				client: unknown;
				tableName: string;
				onEvent: (payload: unknown) => Effect.Effect<void, Error>;
			}) => {
				// verify inputs
				expect(client).toBe(fakeClient);
				expect(tableName).toBe("event_library");
				// exercise the handler immediately with a test payload so we don't need to call it later
				void Effect.runPromise(onEvent({ eventType: "INSERT", new: { event_id: "e1" } }));
				return (): void => {
					cleanupCalled = true;
				};
			},
		);

		vi.mocked(handleEventLibrarySubscribeEvent).mockImplementation(() =>
			Effect.sync(() => undefined),
		);

		const get = makeEventLibrarySlice();
		const eff = subscribeToEventLibraryEffect(get);
		const cleanup = await Effect.runPromise(eff);
		expect(typeof cleanup).toBe("function");

		// the mock implementation already invoked the handler with the payload
		const testPayload = { eventType: "INSERT", new: { event_id: "e1" } };
		expect(vi.mocked(handleEventLibrarySubscribeEvent)).toHaveBeenCalledWith(
			testPayload,
			fakeClient,
			get,
		);

		// ensure cleanup function calls underlying subscription cleanup
		cleanup();
		expect(cleanupCalled).toBe(true);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
		vi.mocked(createRealtimeSubscription).mockReset();
		vi.mocked(handleEventLibrarySubscribeEvent).mockReset();
	});

	it("fails when no Supabase client is available", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		await expect(
			Effect.runPromise(subscribeToEventLibraryEffect(makeEventLibrarySlice())),
		).rejects.toThrow(/No Supabase client available/);
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});

	it("fails when subscription creation fails", async () => {
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockImplementation(() => {
			throw new Error("create-failed");
		});

		await expect(
			Effect.runPromise(subscribeToEventLibraryEffect(makeEventLibrarySlice())),
		).rejects.toThrow(/create-failed/);
		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
		vi.mocked(createRealtimeSubscription).mockReset();
	});

	it("propagates auth token errors", async () => {
		vi.mocked(getSupabaseAuthToken).mockRejectedValue(new Error("auth-error"));
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());

		await expect(
			Effect.runPromise(subscribeToEventLibraryEffect(makeEventLibrarySlice())),
		).rejects.toThrow(/auth-error/);

		vi.mocked(getSupabaseAuthToken).mockReset();
		vi.mocked(getSupabaseClient).mockReset();
	});
});
