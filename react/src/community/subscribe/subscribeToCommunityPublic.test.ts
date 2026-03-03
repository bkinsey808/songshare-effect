import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import handleCommunityPublicSubscribeEvent from "./handleCommunityPublicSubscribeEvent";
import subscribeToCommunityPublic from "./subscribeToCommunityPublic";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("./handleCommunityPublicSubscribeEvent");

describe("subscribeToCommunityPublic", () => {
	it("fails when no supabase client is available", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const eff = subscribeToCommunityPublic("c1", () =>
			forceCast<CommunitySlice>({ currentCommunity: undefined, setCurrentCommunity: vi.fn() }),
		);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/No Supabase client available/);
	});

	it("creates a subscription, wires events, and returns a cleanup that calls underlying cleanup", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const fakeClient = forceCast<SupabaseClientLike | undefined>({ client: true });
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const cleanupSpy = vi.fn();
		let capturedOnEvent: ((payload: unknown) => Effect.Effect<void, Error>) | undefined = undefined;

		vi.mocked(createRealtimeSubscription).mockImplementation(
			({ client, tableName, filter, onEvent }) => {
				expect(client).toBe(fakeClient);
				expect(tableName).toBe("community_public");
				expect(filter).toBe("community_id=eq.c1");
				capturedOnEvent = onEvent;
				return cleanupSpy;
			},
		);

		const handleMock = vi.mocked(handleCommunityPublicSubscribeEvent);
		handleMock.mockReturnValue(Effect.void);

		function get(): CommunitySlice {
			return forceCast({ currentCommunity: undefined, setCurrentCommunity: vi.fn() });
		}

		const eff = subscribeToCommunityPublic("c1", get);

		const cleanup = await Effect.runPromise(eff);

		expect(typeof cleanup).toBe("function");

		// simulate an incoming realtime event
		const payload = { some: "payload" };
		expect(capturedOnEvent).toBeDefined();
		const fn = forceCast<(payloadArg: unknown) => Effect.Effect<void, Error>>(capturedOnEvent);
		await Effect.runPromise(fn(payload));

		expect(handleMock).toHaveBeenCalledWith(payload, get);

		cleanup();
		const EXPECT_ONE_CALL = 1;
		expect(cleanupSpy).toHaveBeenCalledTimes(EXPECT_ONE_CALL);
	});
});
