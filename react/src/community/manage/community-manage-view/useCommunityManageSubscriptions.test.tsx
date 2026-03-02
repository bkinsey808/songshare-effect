import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import subscribeToCommunityEvent from "@/react/community/subscribe/subscribeToCommunityEvent";
import subscribeToCommunityPublic from "@/react/community/subscribe/subscribeToCommunityPublic";
import forceCast from "@/react/lib/test-utils/forceCast";

import useCommunityManageSubscriptions from "./useCommunityManageSubscriptions";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/community/subscribe/subscribeToCommunityEvent");
vi.mock("@/react/community/subscribe/subscribeToCommunityPublic");

// Module-level defaults — override per-test when specific return values are needed
vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(() => undefined));

const COMMUNITY_ID = "c1";

describe("useCommunityManageSubscriptions", () => {
	it("skips community_event subscription when communityId is undefined", () => {
		vi.clearAllMocks();

		renderHook(() => {
			useCommunityManageSubscriptions(undefined);
		});

		expect(vi.mocked(subscribeToCommunityEvent)).not.toHaveBeenCalled();
	});

	it("skips community_public subscription when communityId is undefined", () => {
		vi.clearAllMocks();

		renderHook(() => {
			useCommunityManageSubscriptions(undefined);
		});

		expect(vi.mocked(subscribeToCommunityPublic)).not.toHaveBeenCalled();
	});

	it("subscribes to community_event with communityId and getState", async () => {
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		renderHook(() => {
			useCommunityManageSubscriptions(COMMUNITY_ID);
		});

		await waitFor(() => {
			expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
		});
	});

	it("subscribes to community_public with communityId and getState", async () => {
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		renderHook(() => {
			useCommunityManageSubscriptions(COMMUNITY_ID);
		});

		await waitFor(() => {
			expect(vi.mocked(subscribeToCommunityPublic)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
		});
	});

	it("calls community_event cleanup on unmount", async () => {
		const cleanupEvent = vi.fn();
		vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(cleanupEvent));
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		const { unmount } = renderHook(() => {
			useCommunityManageSubscriptions(COMMUNITY_ID);
		});

		await waitFor(() => {
			expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
		});

		unmount();

		expect(cleanupEvent).toHaveBeenCalledWith();
	});

	it("calls community_public cleanup on unmount", async () => {
		const cleanupPublic = vi.fn();
		vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(cleanupPublic));
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		const { unmount } = renderHook(() => {
			useCommunityManageSubscriptions(COMMUNITY_ID);
		});

		await waitFor(() => {
			expect(vi.mocked(subscribeToCommunityPublic)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
		});

		unmount();

		expect(cleanupPublic).toHaveBeenCalledWith();
	});

	it("begins subscribing once communityId transitions from undefined to defined", async () => {
		vi.clearAllMocks();
		vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
		vi.mocked(subscribeToCommunityPublic).mockReturnValue(Effect.succeed(() => undefined));
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		const { rerender } = renderHook(
			({ id }) => {
				useCommunityManageSubscriptions(id);
			},
			{ initialProps: { id: undefined as string | undefined } },
		);

		expect(vi.mocked(subscribeToCommunityEvent)).not.toHaveBeenCalled();

		rerender({ id: COMMUNITY_ID });

		await waitFor(() => {
			expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
			expect(vi.mocked(subscribeToCommunityPublic)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
			);
		});
	});
});
