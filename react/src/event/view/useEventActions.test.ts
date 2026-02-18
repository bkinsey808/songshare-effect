import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";

import useEventActions from "./useEventActions";

describe("useEventActions", () => {
	it("sets success when join action succeeds", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const leaveEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				joinEvent,
				leaveEvent,
			}),
		);

		result.current.handleJoinEvent();

		await waitFor(() => {
			expect(result.current.actionSuccess).toBe("Successfully joined the event!");
			expect(result.current.actionLoading).toBe(false);
		});
		expect(joinEvent).toHaveBeenCalledWith("e1");
	});

	it("sets error when leave action fails", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const leaveEvent = vi.fn().mockReturnValue(Effect.fail(new Error("leave failed")));
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				joinEvent,
				leaveEvent,
			}),
		);

		result.current.handleLeaveEvent();

		await waitFor(() => {
			expect(result.current.actionError).toMatch(/leave failed|Failed to leave event/);
			expect(result.current.actionLoading).toBe(false);
		});
		expect(leaveEvent).toHaveBeenCalledWith("e1", "u1");
	});

	it("clears action messages", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.fail(new Error("join failed")));
		const leaveEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				joinEvent,
				leaveEvent,
			}),
		);

		result.current.handleJoinEvent();

		await waitFor(() => {
			expect(result.current.actionError).toMatch(/join failed|Failed to join event/);
		});

		result.current.clearActionError();

		await waitFor(() => {
			expect(result.current.actionError).toBeUndefined();
		});
	});
});
