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
				fetchEventBySlug,
			});
		});

		await waitFor(() => {
			expect(vi.mocked(createRealtimeSubscription)).not.toHaveBeenCalled();
		});
	});
});
