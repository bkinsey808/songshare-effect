import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { useParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";

import useEventView from "./useEventView";

vi.mock("react-router-dom");
vi.mock("@/react/auth/useCurrentUserId");

describe("useEventView", () => {
	// No lifecycle hooks per test guidelines: reset in each test instead

	it("calls fetchEventBySlug when slug is present", async () => {
		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, fetchEventBySlug: mockFetch }));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("my-slug");
		});
	});

	it("auto-joins authenticated user who is not a participant", async () => {
		const mockFetch = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const mockJoin = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const store: typeof useAppStore = useAppStore;
		store.setState((prev) => ({ ...prev, fetchEventBySlug: mockFetch, joinEvent: mockJoin }));

		vi.mocked(useParams).mockReturnValue({ event_slug: "my-slug" });
		vi.mocked(useCurrentUserId).mockReturnValue("u1");

		const currentEvent = makeEventEntry({ participants: [] });
		store.setState((prev) => ({ ...prev, currentEvent, isEventLoading: false }));

		renderHook(() => useEventView());

		await waitFor(() => {
			expect(mockJoin).toHaveBeenCalledWith("e1");
		});
	});

	it("handleJoinEvent sets success and clears loading on success", async () => {
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
});
