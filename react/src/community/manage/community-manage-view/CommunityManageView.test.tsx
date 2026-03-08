import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CommunityEntry } from "@/react/community/community-types";
import forceCast from "@/react/lib/test-utils/forceCast";

import useCommunityManageBody from "./body/useCommunityManageBody";
import CommunityManageView from "./CommunityManageView";
import useCommunityManageView, {
	type UseCommunityManageViewReturn,
} from "./useCommunityManageView";

vi.mock("./useCommunityManageView");
vi.mock("./body/useCommunityManageBody");

const mockBodyReturn = {
	members: [],
	communityEvents: [],
	communitySongs: [],
	communityPlaylists: [],
	communityShareRequests: [],
	availableSongOptions: [],
	availablePlaylistOptions: [],
	actionState: {
		loadingKey: undefined,
		error: undefined,
		errorKey: undefined,
		success: undefined,
		successKey: undefined,
	},
	inviteUserIdInput: undefined,
	setInviteUserIdInput: (): void => undefined,
	onInviteClick: (): void => undefined,
	addEventIdInput: undefined,
	setAddEventIdInput: (): void => undefined,
	onAddEventClick: (): void => undefined,
	addSongIdInput: undefined,
	setAddSongIdInput: (): void => undefined,
	onAddSongClick: (): void => undefined,
	onRemoveSongClick: (): void => undefined,
	addPlaylistIdInput: undefined,
	setAddPlaylistIdInput: (): void => undefined,
	onAddPlaylistClick: (): void => undefined,
	onRemovePlaylistClick: (): void => undefined,
	onReviewShareRequestClick: (): void => undefined,
	onRemoveEventClick: (): void => undefined,
	onSetActiveEventClick: (): void => undefined,
	activeEventId: undefined,
	onKickClick: (): void => undefined,
	onBackClick: (): void => undefined,
	onDismissInviteAlert: (): void => undefined,
};

describe("communityManageView", () => {
	it("renders loading state", () => {
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: undefined,
				isCommunityLoading: true,
				communityError: undefined,
				canManage: undefined,
				onBackClick: (): void => undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/Loading manager/i)).toBeDefined();
	});

	it("renders not-found error", () => {
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity: undefined,
				isCommunityLoading: false,
				communityError: "boom",
				canManage: undefined,
				onBackClick: (): void => undefined,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText("boom")).toBeDefined();
	});

	it("shows access denied and calls back on Back click", () => {
		const onBack = vi.fn();
		const currentCommunity = forceCast<CommunityEntry>({
			community_id: "c1",
			owner_id: "o1",
			name: "C",
			slug: "c",
			description: forceCast<string | null>(undefined),
			is_public: true,
			public_notes: forceCast<string | null>(undefined),
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
		});
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity,
				isCommunityLoading: false,
				communityError: undefined,
				canManage: false,
				onBackClick: onBack,
			}),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/Only owners and admins/i)).toBeDefined();
		fireEvent.click(screen.getByText(/Back to Community/i));
		expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ type: "click" }));
	});

	it("renders empty members and events when can manage", () => {
		const currentCommunity = forceCast<CommunityEntry>({
			community_id: "c1",
			owner_id: "o1",
			name: "C",
			slug: "c",
			description: forceCast<string | null>(undefined),
			is_public: true,
			public_notes: forceCast<string | null>(undefined),
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
			active_event_id: undefined,
		});
		vi.mocked(useCommunityManageView).mockReturnValue(
			forceCast<UseCommunityManageViewReturn>({
				currentCommunity,
				isCommunityLoading: false,
				communityError: undefined,
				canManage: true,
				onBackClick: (): void => undefined,
			}),
		);
		vi.mocked(useCommunityManageBody).mockReturnValue(
			forceCast<ReturnType<typeof useCommunityManageBody>>(mockBodyReturn),
		);

		render(<CommunityManageView />);
		expect(screen.getByText(/No pending invitations/i)).toBeDefined();
		expect(
			screen.getByText(/Events associated with this community will appear here/i),
		).toBeDefined();
	});
});
