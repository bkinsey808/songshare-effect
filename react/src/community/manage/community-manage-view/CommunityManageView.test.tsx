import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
// CommunityEntry type not needed directly in this test

import CommunityManageView from "./CommunityManageView";
import useCommunityManageView, {
	type UseCommunityManageViewReturn,
} from "./useCommunityManageView";

vi.mock("./useCommunityManageView");

describe("communityManageView", () => {
	it("renders loading state", () => {
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: undefined,
				members: [],
				communityEvents: [],
				isCommunityLoading: true,

				communityError: undefined,
				canManage: undefined,
				actionState: {
					loadingKey: undefined,
					error: undefined,
					errorKey: undefined,
					success: undefined,
					successKey: undefined,
				},
				inviteUserIdInput: undefined,
				setInviteUserIdInput: () => undefined,
				onInviteClick: () => undefined,
				addEventIdInput: undefined,
				setAddEventIdInput: () => undefined,
				onAddEventClick: () => undefined,
				onRemoveEventClick: () => undefined,
				onKickClick: () => undefined,
				onBackClick: () => undefined,
				userSessionData: undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/Loading manager/i)).toBeDefined();
	});

	it("renders not-found error", () => {
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: undefined,
				members: [],
				communityEvents: [],
				isCommunityLoading: false,
				communityError: "boom",
				canManage: undefined,
				actionState: {
					loadingKey: undefined,
					error: undefined,
					errorKey: undefined,
					success: undefined,
					successKey: undefined,
				},
				inviteUserIdInput: undefined,
				setInviteUserIdInput: () => undefined,
				onInviteClick: () => undefined,
				addEventIdInput: undefined,
				setAddEventIdInput: () => undefined,
				onAddEventClick: () => undefined,
				onRemoveEventClick: () => undefined,
				onKickClick: () => undefined,
				onBackClick: () => undefined,
				userSessionData: undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText("boom")).toBeDefined();
	});

	it("shows access denied and calls back on Back click", () => {
		const onBack = vi.fn();
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: { community_id: "c1", name: "C" },
				members: [],
				communityEvents: [],
				isCommunityLoading: false,
				communityError: undefined,
				canManage: false,
				actionState: {
					loadingKey: undefined,
					error: undefined,
					errorKey: undefined,
					success: undefined,
					successKey: undefined,
				},
				inviteUserIdInput: undefined,
				setInviteUserIdInput: () => undefined,
				onInviteClick: () => undefined,
				addEventIdInput: undefined,
				setAddEventIdInput: () => undefined,
				onAddEventClick: () => undefined,
				onRemoveEventClick: () => undefined,
				onKickClick: () => undefined,
				onBackClick: onBack,
				userSessionData: undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/Only owners and admins/i)).toBeDefined();
		fireEvent.click(screen.getByText(/Back to Community/i));
		expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ type: "click" }));
	});

	it("renders empty members and events when can manage", () => {
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: { community_id: "c1", name: "C" },
				members: [],
				communityEvents: [],
				isCommunityLoading: false,
				communityError: undefined,
				canManage: true,
				actionState: {
					loadingKey: undefined,
					error: undefined,
					errorKey: undefined,
					success: undefined,
					successKey: undefined,
				},
				inviteUserIdInput: undefined,
				setInviteUserIdInput: () => undefined,
				onInviteClick: () => undefined,
				addEventIdInput: undefined,
				setAddEventIdInput: () => undefined,
				onAddEventClick: () => undefined,
				onRemoveEventClick: () => undefined,
				onKickClick: () => undefined,
				onBackClick: () => undefined,
				userSessionData: undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/No pending invitations/i)).toBeDefined();
		expect(
			screen.getByText(/Events associated with this community will appear here/i),
		).toBeDefined();
	});
});
