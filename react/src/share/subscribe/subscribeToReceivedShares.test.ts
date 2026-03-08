import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseClientLike } from "@/react/lib/supabase/client/SupabaseClientLike";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { ShareSlice } from "../slice/ShareSlice.type";

import handleShareSubscribeEvent from "./handleShareSubscribeEvent";
import subscribeToReceivedShares from "./subscribeToReceivedShares";

const CURRENT_USER_ID = "user-abc";
const EXPECT_ONE_CALL = 1;

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("./handleShareSubscribeEvent");

describe("subscribeToReceivedShares", () => {
	function get(): ShareSlice {
		return forceCast<ShareSlice>({});
	}

	it("fails when no supabase client is available", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const eff = subscribeToReceivedShares(get, CURRENT_USER_ID);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/No Supabase client available/);
	});

	it("fails when no user ID is available for subscription", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const fakeClient = forceCast<SupabaseClientLike | undefined>({ client: true });
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const eff = subscribeToReceivedShares(get, "");

		await expect(Effect.runPromise(eff)).rejects.toThrow(
			/No user ID available for subscription/,
		);
	});

	it("creates a subscription, wires events, and returns a cleanup that calls underlying cleanup", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		const fakeClient = forceCast<SupabaseClientLike | undefined>({ client: true });
		vi.mocked(getSupabaseClient).mockReturnValue(fakeClient);

		const cleanupSpy = vi.fn();
		let capturedOnEvent: ((payload: unknown) => Effect.Effect<void, Error>) | undefined =
			undefined;

		vi.mocked(createRealtimeSubscription).mockImplementation(
			({ client, tableName, filter, onEvent }) => {
				expect(client).toBe(fakeClient);
				expect(tableName).toBe("share_public");
				expect(filter).toBe(`recipient_user_id=eq.${CURRENT_USER_ID}`);
				capturedOnEvent = onEvent;
				return cleanupSpy;
			},
		);

		const handleMock = vi.mocked(handleShareSubscribeEvent);
		handleMock.mockReturnValue(Effect.void);

		const eff = subscribeToReceivedShares(get, CURRENT_USER_ID);

		const cleanup = await Effect.runPromise(eff);

		expect(typeof cleanup).toBe("function");

		const payload = { eventType: "INSERT", new: {} };
		expect(capturedOnEvent).toBeDefined();
		const fn = forceCast<(payloadArg: unknown) => Effect.Effect<void, Error>>(capturedOnEvent);
		await Effect.runPromise(fn(payload));

		expect(handleMock).toHaveBeenCalledWith(payload, fakeClient, {
			get,
			shareType: "received",
		});

		cleanup();
		expect(cleanupSpy).toHaveBeenCalledTimes(EXPECT_ONE_CALL);
	});
});
