import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import type { CommunityEntry } from "@/react/community/community-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import postJson from "@/shared/fetch/postJson";

import useCommunityManageBody from "./useCommunityManageBody";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/shared/fetch/postJson");

const currentCommunity = forceCast<CommunityEntry>({
	community_id: "c1",
	owner_id: "o1",
	name: "Test",
	slug: "test",
	description: forceCast<string | null>(undefined),
	is_public: true,
	public_notes: forceCast<string | null>(undefined),
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-01T00:00:00Z",
	active_event_id: undefined,
});

type StoreOverrides = {
	members?: unknown;
	communityEvents?: unknown;
	communitySongs?: unknown;
	communityPlaylists?: unknown;
	communityShareRequests?: unknown;
	songLibraryEntries?: unknown;
	playlistLibraryEntries?: unknown;
	userSessionData?: unknown;
	fetchCommunityBySlug?: unknown;
	fetchSongLibrary?: unknown;
	fetchPlaylistLibrary?: unknown;
};

function installStoreMocks(overrides: StoreOverrides = {}): void {
	const {
		members = [],
		communityEvents = [],
		communitySongs = [],
		communityPlaylists = [],
		communityShareRequests = [],
		songLibraryEntries = {},
		playlistLibraryEntries = {},
		userSessionData = undefined,
		fetchCommunityBySlug = vi.fn().mockResolvedValue(undefined),
		fetchSongLibrary = vi.fn().mockResolvedValue(undefined),
		fetchPlaylistLibrary = vi.fn().mockResolvedValue(undefined),
	} = overrides;

	vi.mocked(useAppStore).mockImplementation((selector: unknown): unknown => {
		const sel = String(selector);
		if (sel.includes("members")) {
			return members;
		}
		if (sel.includes("communityEvents")) {
			return communityEvents;
		}
		if (sel.includes("communitySongs")) {
			return communitySongs;
		}
		if (sel.includes("communityPlaylists")) {
			return communityPlaylists;
		}
		if (sel.includes("communityShareRequests")) {
			return communityShareRequests;
		}
		if (sel.includes("songLibraryEntries")) {
			return songLibraryEntries;
		}
		if (sel.includes("playlistLibraryEntries")) {
			return playlistLibraryEntries;
		}
		if (sel.includes("userSessionData")) {
			return userSessionData;
		}
		if (sel.includes("fetchCommunityBySlug")) {
			return fetchCommunityBySlug;
		}
		if (sel.includes("fetchSongLibrary")) {
			return fetchSongLibrary;
		}
		if (sel.includes("fetchPlaylistLibrary")) {
			return fetchPlaylistLibrary;
		}
		return undefined;
	});
}

describe("useCommunityManageBody", () => {
	it("invites a user: calls postJson and clears input on success", async () => {
		vi.resetAllMocks();
		const mockPost = vi.mocked(postJson);
		mockPost.mockResolvedValue(undefined);

		installStoreMocks({
			userSessionData: { user: { user_id: "o1" } },
		});

		const { result } = renderHook(() => useCommunityManageBody(currentCommunity), {
			wrapper: ({ children }) => (
				<RouterWrapper path="/:community_slug/:lang" initialEntries={["/test-slug/en"]}>
					{children}
				</RouterWrapper>
			),
		});

		result.current.setInviteUserIdInput("invitee-1");
		await waitFor(() => {
			expect(result.current.inviteUserIdInput).toBe("invitee-1");
		});
		result.current.onInviteClick();

		await waitFor(() => {
			expect(mockPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ user_id: "invitee-1" }),
			);
		});
		await waitFor(() => {
			expect(result.current.inviteUserIdInput).toBeUndefined();
		});
		await waitFor(() => {
			expect(result.current.actionState.success).toBe("Member invited successfully");
		});
	});
});
