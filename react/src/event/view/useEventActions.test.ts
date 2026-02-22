import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import useEventActions from "./useEventActions";

describe("useEventActions", () => {
	it("sets success when join action succeeds", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const leaveEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const setCurrentEvent = vi.fn<(value: ReturnType<typeof makeEventEntry> | undefined) => void>();
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				currentUsername: "u1_name",
				setCurrentEvent,
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

	it("optimistically adds current user with username after join success", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const leaveEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const setCurrentEvent = vi.fn<(value: ReturnType<typeof makeEventEntry> | undefined) => void>();
		const currentEvent = makeEventEntry({ participants: [] });

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u2",
				currentUsername: "joined_user",
				setCurrentEvent,
				joinEvent,
				leaveEvent,
			}),
		);

		result.current.handleJoinEvent();

		await waitFor(() => {
			const calls = forceCast<[ReturnType<typeof makeEventEntry>][]>(setCurrentEvent.mock.calls);
			const FIRST_CALL_INDEX = 0;
			const FN_ARG_INDEX = 0;
			const firstCall = calls[FIRST_CALL_INDEX]?.[FN_ARG_INDEX];
			expect(firstCall?.participants).toStrictEqual(
				expect.arrayContaining([
					expect.objectContaining({ user_id: "u2", username: "joined_user" }),
				]),
			);
		});
	});

	it("sets error when leave action fails", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const leaveEvent = vi.fn().mockReturnValue(Effect.fail(new Error("leave failed")));
		const setCurrentEvent = vi.fn<(value: ReturnType<typeof makeEventEntry> | undefined) => void>();
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				currentUsername: "u1_name",
				setCurrentEvent,
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
		const setCurrentEvent = vi.fn<(value: ReturnType<typeof makeEventEntry> | undefined) => void>();
		const currentEvent = makeEventEntry();

		const { result } = renderHook(() =>
			useEventActions({
				currentEvent,
				currentUserId: "u1",
				currentUsername: "u1_name",
				setCurrentEvent,
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
