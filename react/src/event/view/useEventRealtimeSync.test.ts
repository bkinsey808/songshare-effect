import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import useEventRealtimeSync from "./useEventRealtimeSync";

vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
const mockedCreateRealtimeSubscription = vi.mocked(createRealtimeSubscription);
const EXPECTED_SUBSCRIPTION_COUNT = 2;

function assertDefined<TVal>(value: TVal | undefined): asserts value is TVal {
	if (value === undefined) {
		throw new Error("expected defined");
	}
}

describe("useEventRealtimeSync", () => {
	it("subscribes to event_public and event_user channels", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventRealtimeSync({
				eventSlug: "my-slug",
				eventId: "e1",
				currentUserId: "u1",
				fetchEventBySlug,
			});
		});

		await waitFor(() => {
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({ tableName: "event_public", filter: "event_slug=eq.my-slug" }),
			);
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({ tableName: "event_user", filter: "event_id=eq.e1" }),
			);
		});
	});

	it("skips subscriptions when event slug is missing", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventRealtimeSync({
				eventSlug: undefined,
				eventId: "e1",
				currentUserId: "u1",
				fetchEventBySlug,
			});
		});

		await waitFor(() => {
			expect(vi.mocked(createRealtimeSubscription)).not.toHaveBeenCalled();
		});
	});

	it("ignores event_user INSERT events for the current user", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);
		const fetchEventBySlug = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventRealtimeSync({
				eventSlug: "my-slug",
				eventId: "e1",
				currentUserId: "u1",
				fetchEventBySlug,
			});
		});

		await waitFor(() => {
			expect(mockedCreateRealtimeSubscription).toHaveBeenCalledTimes(EXPECTED_SUBSCRIPTION_COUNT);
		});

		const eventUserConfig = mockedCreateRealtimeSubscription.mock.calls
			.map(
				([call]) =>
					call as {
						tableName?: string;
						onEvent?: (payload: unknown) => Effect.Effect<unknown, unknown, unknown>;
					},
			)
			.find((config) => config.tableName === "event_user");
		expect(eventUserConfig).toBeDefined();
		assertDefined(eventUserConfig);

		await Effect.runPromise(
			eventUserConfig.onEvent({
				eventType: "INSERT",
				new: { user_id: "u1" },
			}),
		);

		expect(fetchEventBySlug).not.toHaveBeenCalled();
	});
});
