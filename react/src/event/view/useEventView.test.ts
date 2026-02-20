import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/test-utils/createMinimalSupabaseClient.mock";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";

import useEventView from "./useEventView";

vi.mock("react-router-dom");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

describe("useEventView", () => {
	// No lifecycle hooks per test guidelines: reset in each test instead

	it("calls fetchEventBySlug when slug is present", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, fetchEventBySlug: mockFetch }));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("my-slug");
		});
	});

	it("does not auto-join authenticated invited user", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const mockJoin = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, fetchEventBySlug: mockFetch, joinEvent: mockJoin }));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const currentEvent = makeEventEntry({ owner_id: "owner-1", participants: [] });
		store.setState((prev) => ({ ...prev, currentEvent, isEventLoading: false }));

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("my-slug");
		});

		expect(mockJoin).not.toHaveBeenCalled();
	});

	it("does not auto-join when current user is the event owner", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const mockJoin = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, fetchEventBySlug: mockFetch, joinEvent: mockJoin }));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });
		vi.mocked(useCurrentUserId).mockReturnValue("owner-1");

		const currentEvent = makeEventEntry({ owner_id: "owner-1", participants: [] });
		store.setState((prev) => ({ ...prev, currentEvent, isEventLoading: false }));

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("my-slug");
		});

		expect(mockJoin).not.toHaveBeenCalled();
	});

	it("handleJoinEvent sets success and clears loading on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockJoin = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, joinEvent: mockJoin }));

		const currentEvent = makeEventEntry();
		store.setState((prev) => ({ ...prev, currentEvent }));

		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventView());

		// Trigger the join action (no deprecated `act` wrapper needed)
		result.current.handleJoinEvent();

		await waitFor(() => {
			expect(result.current.actionSuccess).toBe("Successfully joined the event!");
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleJoinEvent sets error on failure", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockJoin = vi.fn().mockReturnValue(Effect.fail(new Error("boom")));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, joinEvent: mockJoin }));

		const currentEvent = makeEventEntry();
		store.setState((prev) => ({ ...prev, currentEvent }));

		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventView());

		// Trigger the join action (no deprecated `act` wrapper needed)
		result.current.handleJoinEvent();

		await waitFor(() => {
			expect(result.current.actionError).toMatch(/boom|Failed to join event/);
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleLeaveEvent sets success and clears loading on success", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockLeave = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, leaveEvent: mockLeave }));

		const currentEvent = makeEventEntry();
		store.setState((prev) => ({ ...prev, currentEvent }));

		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventView());

		// Trigger the leave action (no deprecated `act` wrapper needed)
		result.current.handleLeaveEvent();

		await waitFor(() => {
			expect(result.current.actionSuccess).toBe("Successfully left the event!");
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleLeaveEvent sets error on failure", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockLeave = vi.fn().mockReturnValue(Effect.fail(new Error("leave boom")));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, leaveEvent: mockLeave }));

		const currentEvent = makeEventEntry();
		store.setState((prev) => ({ ...prev, currentEvent }));

		vi.mocked(useParams).mockReturnValue({});
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const { result } = renderHook(() => useEventView());

		// Trigger the leave action (no deprecated `act` wrapper needed)
		result.current.handleLeaveEvent();

		await waitFor(() => {
			expect(result.current.actionError).toMatch(/leave boom|Failed to leave event/);
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("subscribes to event_public and event_user changes", async () => {
		vi.resetAllMocks();
		vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
		vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
		vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);

		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({
			...prev,
			fetchEventBySlug: mockFetch,
			currentEvent: makeEventEntry({ event_id: "e1" }),
			isEventLoading: false,
		}));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({
					tableName: "event_public",
					filter: "event_slug=eq.my-slug",
				}),
			);
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({
					tableName: "event_user",
					filter: "event_id=eq.e1",
				}),
			);
		});
	});
});
