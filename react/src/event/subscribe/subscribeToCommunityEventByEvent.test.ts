import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";

import handleCommunityEventByEventSubscribeEvent from "./handleCommunityEventByEventSubscribeEvent";
import subscribeToCommunityEventByEvent from "./subscribeToCommunityEventByEvent";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("./handleCommunityEventByEventSubscribeEvent");

const ONE = 1;

describe("subscribeToCommunityEventByEvent", () => {
	it("fails when no Supabase client is available", async () => {
		vi.resetAllMocks();

		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		const get = vi.fn().mockReturnValue(forceCast({}));
		const eff = subscribeToCommunityEventByEvent("evt-1", forceCast(get));

		await expect(Effect.runPromise(eff)).rejects.toThrow("No Supabase client available");
	});

	it("creates a realtime subscription and returns cleanup function", async () => {
		vi.resetAllMocks();

		const eventId = "evt-2";
		const supabaseClient = createMinimalSupabaseClient();
		const cleanupMock = vi.fn();

		const payload = { test: 123 };

		vi.mocked(getSupabaseClient).mockReturnValue(supabaseClient);
		vi.mocked(createRealtimeSubscription).mockImplementation(
			(opts: { onEvent: (payload: unknown) => void }) => {
				// simulate an incoming realtime event immediately
				opts.onEvent(payload);
				return cleanupMock;
			},
		);

		const get = vi.fn().mockReturnValue(forceCast({ some: "slice" }));

		const eff = subscribeToCommunityEventByEvent(eventId, forceCast(get));

		const cleanup = await Effect.runPromise(eff);

		// invoking returned cleanup should call underlying subscription cleanup
		cleanup();
		expect(cleanupMock).toHaveBeenCalledTimes(ONE);

		// ensure subscription was created with correct table and filter
		expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
			expect.objectContaining({ tableName: "community_event", filter: `event_id=eq.${eventId}` }),
		);

		// ensure onEvent wired to handler
		expect(vi.mocked(handleCommunityEventByEventSubscribeEvent)).toHaveBeenCalledWith(
			payload,
			eventId,
			forceCast(get),
		);
	});
});
