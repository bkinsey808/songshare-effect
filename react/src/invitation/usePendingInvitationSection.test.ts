import { renderHook } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import usePendingInvitationSection from "./usePendingInvitationSection";

vi.mock("@/react/app-store/useAppStore");

describe("usePendingInvitationSection", () => {
	it("returns state from app store", () => {
		vi.mocked(useAppStore).mockImplementation((selector) =>
			selector(
				forceCast({
					pendingCommunityInvitations: [{ community_id: "c1" }],
					pendingEventInvitations: [],
					invitationError: "none",
				}),
			),
		);

		const { result } = renderHook(() => usePendingInvitationSection());

		expect(result.current.pendingCommunityInvitations).toStrictEqual([{ community_id: "c1" }]);
		expect(result.current.hasInvitations).toBe(true);
		expect(result.current.invitationError).toBe("none");
	});

	it("calls handlers from app store correctly", () => {
		const acceptCommunityMock = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const declineCommunityMock = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const acceptEventMock = vi.fn().mockReturnValue(Effect.succeed(undefined));
		const declineEventMock = vi.fn().mockReturnValue(Effect.succeed(undefined));

		vi.mocked(useAppStore).mockImplementation((selector) =>
			selector(
				forceCast({
					pendingCommunityInvitations: [],
					pendingEventInvitations: [],
					acceptCommunityInvitation: acceptCommunityMock,
					declineCommunityInvitation: declineCommunityMock,
					acceptEventInvitation: acceptEventMock,
					declineEventInvitation: declineEventMock,
					userSessionData: { user: { user_id: "u1" } },
				}),
			),
		);

		const { result } = renderHook(() => usePendingInvitationSection());

		result.current.handleAcceptCommunity("c1");
		expect(acceptCommunityMock).toHaveBeenCalledWith("c1");

		result.current.handleDeclineCommunity("c1");
		expect(declineCommunityMock).toHaveBeenCalledWith("c1");

		result.current.handleAcceptEvent("e1");
		expect(acceptEventMock).toHaveBeenCalledWith("e1");

		result.current.handleDeclineEvent("e1");
		expect(declineEventMock).toHaveBeenCalledWith("e1", "u1");
	});

	it("returns hasInvitations: false when both lists are empty", () => {
		vi.mocked(useAppStore).mockImplementation((selector) =>
			selector(
				forceCast({
					pendingCommunityInvitations: [],
					pendingEventInvitations: [],
					invitationError: undefined,
				}),
			),
		);

		const { result } = renderHook(() => usePendingInvitationSection());
		expect(result.current.hasInvitations).toBe(false);
	});
});
