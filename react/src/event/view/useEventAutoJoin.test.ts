import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";

import useEventAutoJoin from "./useEventAutoJoin";

const SINGLE_CALL_COUNT = 1;

describe("useEventAutoJoin", () => {
	it("auto-joins when user is authenticated and not participant or owner", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventAutoJoin({
				isEventLoading: false,
				currentEvent: makeEventEntry({ owner_id: "owner-1", participants: [] }),
				currentUserId: "user-2",
				joinEvent,
			});
		});

		await waitFor(() => {
			expect(joinEvent).toHaveBeenCalledWith("e1");
		});
	});

	it("does not auto-join when user is owner", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

		renderHook(() => {
			useEventAutoJoin({
				isEventLoading: false,
				currentEvent: makeEventEntry({ owner_id: "owner-1", participants: [] }),
				currentUserId: "owner-1",
				joinEvent,
			});
		});

		await waitFor(() => {
			expect(joinEvent).not.toHaveBeenCalled();
		});
	});

	it("attempts auto-join only once across rerenders", async () => {
		const joinEvent = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));
		const currentEvent = makeEventEntry({ owner_id: "owner-1", participants: [] });

		const { rerender } = renderHook(
			(params: { isEventLoading: boolean; currentUserId: string }) => {
				useEventAutoJoin({
					isEventLoading: params.isEventLoading,
					currentEvent,
					currentUserId: params.currentUserId,
					joinEvent,
				});
			},
			{ initialProps: { isEventLoading: false, currentUserId: "user-2" } },
		);

		await waitFor(() => {
			expect(joinEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		});

		rerender({ isEventLoading: false, currentUserId: "user-2" });

		await waitFor(() => {
			expect(joinEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		});
	});
});
