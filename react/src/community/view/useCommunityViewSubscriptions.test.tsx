import { cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import subscribeToCommunityEvent from "@/react/community/subscribe/subscribeToCommunityEvent";
import subscribeToCommunityPublic from "@/react/community/subscribe/subscribeToCommunityPublic";

import useCommunityViewSubscriptions from "./useCommunityViewSubscriptions";

vi.mock("@/react/community/subscribe/subscribeToCommunityEvent");
vi.mock("@/react/community/subscribe/subscribeToCommunityPublic");
// oxlint-disable-next-line jest/no-untyped-mock-factory -- mock for store getState; minimal stub suffices
vi.mock("@/react/app-store/useAppStore", () => ({
	default: {
		getState: vi.fn(() => ({})),
	},
}));

const COMMUNITY_ID = "comm-123";
const CLEANUP_FN = vi.fn();

describe("useCommunityViewSubscriptions — renderHook", () => {
	it("subscribes to community event and public when communityId is set", async () => {
		vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(CLEANUP_FN));
		vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(CLEANUP_FN));

		renderHook(() => {
			useCommunityViewSubscriptions(COMMUNITY_ID);
		});

		await waitFor(() => {
			expect(subscribeToCommunityEvent).toHaveBeenCalledWith(COMMUNITY_ID, expect.any(Function));
			expect(subscribeToCommunityPublic).toHaveBeenCalledWith(COMMUNITY_ID, expect.any(Function));
		});
	});

	it("does not subscribe when communityId is undefined", () => {
		cleanup();
		vi.clearAllMocks();
		renderHook(() => {
			useCommunityViewSubscriptions(undefined);
		});

		expect(subscribeToCommunityEvent).not.toHaveBeenCalled();
		expect(subscribeToCommunityPublic).not.toHaveBeenCalled();
	});

	it("returns undefined (void hook)", () => {
		vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(() => undefined));

		const { result } = renderHook(() => {
			useCommunityViewSubscriptions(COMMUNITY_ID);
		});

		expect(result.current).toBeUndefined();
	});
});

describe("useCommunityViewSubscriptions — Harness", () => {
	it("harness mounts hook and renders", () => {
		cleanup();
		vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(() => undefined));

		/**
		 * Simple harness component that mounts the hook for testing.
		 *
		 * @returns A tiny React element used as the test harness
		 */
		function Harness(): ReactElement {
			useCommunityViewSubscriptions(COMMUNITY_ID);
			return <div data-testid="harness-root" />;
		}

		const { getByTestId } = render(<Harness />);
		expect(getByTestId("harness-root")).toBeTruthy();
	});
});
