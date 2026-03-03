import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import fetchEventCommunitiesFn from "@/react/event/fetch/fetchEventCommunities";
import subscribeToCommunityEventByEvent from "@/react/event/subscribe/subscribeToCommunityEventByEvent";
import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";
import { apiCommunityEventAddPath, apiCommunityEventRemovePath } from "@/shared/paths";

import runAction from "../runAction";
import useEventCommunityManagement from "./useEventCommunityManagement";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/event/fetch/fetchEventCommunities");
vi.mock("@/react/event/subscribe/subscribeToCommunityEventByEvent");
vi.mock("@/shared/fetch/postJson");
vi.mock("../runAction");

// Default module behaviors — individual tests can override
vi.mocked(fetchEventCommunitiesFn).mockReturnValue(Effect.succeed([] as readonly []));
vi.mocked(subscribeToCommunityEventByEvent).mockReturnValue(Effect.succeed(() => undefined));
vi.mocked(postJson).mockResolvedValue(undefined);

describe("useEventCommunityManagement", () => {
	const EVENT_ID = "e1";
	const COMMUNITY_ID = "c1";

	it("skips fetching event communities when currentEventId is undefined", () => {
		vi.clearAllMocks();

		renderHook(() =>
			// currentEventId undefined
			useEventCommunityManagement({
				currentEventId: undefined,
				event_slug: undefined,
				fetchEventBySlug: () => Effect.succeed(undefined),
				setActionState: () => undefined,
			}),
		);

		expect(vi.mocked(fetchEventCommunitiesFn)).not.toHaveBeenCalled();
	});

	it("calls fetchEventCommunitiesFn when currentEventId is provided", async () => {
		vi.clearAllMocks();
		vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

		renderHook(() =>
			useEventCommunityManagement({
				currentEventId: EVENT_ID,
				event_slug: undefined,
				fetchEventBySlug: () => Effect.succeed(undefined),
				setActionState: () => undefined,
			}),
		);

		await waitFor(() => {
			expect(vi.mocked(fetchEventCommunitiesFn)).toHaveBeenCalledWith(
				EVENT_ID,
				useAppStore.getState,
			);
		});
	});

	it("selects, adds, and clears addCommunityIdInput via onAddCommunityIdSelect/onAddCommunityClick", async () => {
		vi.clearAllMocks();

		// mock runAction to immediately invoke the provided action so postJson runs
		vi.mocked(runAction).mockImplementation(async (opts: { action: () => Promise<void> }) => {
			await opts.action();
		});

		const setActionState = vi.fn();

		const { result } = renderHook(() =>
			useEventCommunityManagement({
				currentEventId: EVENT_ID,
				event_slug: "slug",
				fetchEventBySlug: () => Effect.succeed(undefined),
				setActionState,
			}),
		);

		result.current.onAddCommunityIdSelect(COMMUNITY_ID);

		await waitFor(() => {
			expect(result.current.addCommunityIdInput).toBe(COMMUNITY_ID);
		});

		result.current.onAddCommunityClick();

		await waitFor(() => {
			expect(vi.mocked(postJson)).toHaveBeenCalledWith(apiCommunityEventAddPath, {
				community_id: COMMUNITY_ID,
				event_id: EVENT_ID,
			});
		});

		await waitFor(() => {
			expect(result.current.addCommunityIdInput).toBeUndefined();
		});
	});

	it("removes a community when onRemoveCommunityClick is called", async () => {
		vi.clearAllMocks();

		vi.mocked(runAction).mockImplementation(async (opts: { action: () => Promise<void> }) => {
			await opts.action();
		});

		const setActionState = vi.fn();

		const { result } = renderHook(() =>
			useEventCommunityManagement({
				currentEventId: EVENT_ID,
				event_slug: "slug",
				fetchEventBySlug: () => Effect.succeed(undefined),
				setActionState,
			}),
		);

		result.current.onRemoveCommunityClick(COMMUNITY_ID);

		await waitFor(() => {
			expect(vi.mocked(postJson)).toHaveBeenCalledWith(apiCommunityEventRemovePath, {
				community_id: COMMUNITY_ID,
				event_id: EVENT_ID,
			});
		});
	});
});
