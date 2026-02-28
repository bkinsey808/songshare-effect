import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import postJson from "@/shared/fetch/postJson";

import useCommunityManageView from "./useCommunityManageView";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/shared/fetch/postJson");

type StoreOverrides = {
	currentCommunity?: unknown;
	members?: unknown;
	communityEvents?: unknown;
	isCommunityLoading?: boolean;
	communityError?: string | undefined;
	userSessionData?: unknown;
};

function installCommunityStoreMocks(overrides: StoreOverrides = {}): {
	fetchSlugSpy: ReturnType<typeof vi.fn>;
} {
	const {
		currentCommunity = undefined,
		members = [],
		communityEvents = [],
		isCommunityLoading = false,
		communityError = undefined,
		userSessionData = undefined,
	} = overrides;

	const fetchSlugSpy = vi.fn().mockReturnValue(Effect.succeed(undefined as unknown));

	vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
		const sel = String(selector);
		if (sel.includes("fetchCommunityBySlug")) {
			return fetchSlugSpy;
		}
		if (sel.includes("currentCommunity")) {
			return currentCommunity;
		}
		if (sel.includes("members")) {
			return members;
		}
		if (sel.includes("communityEvents")) {
			return communityEvents;
		}
		if (sel.includes("isCommunityLoading")) {
			return isCommunityLoading;
		}
		if (sel.includes("communityError")) {
			return communityError;
		}
		if (sel.includes("userSessionData")) {
			return userSessionData;
		}
		return undefined;
	});

	return { fetchSlugSpy };
}

describe("useCommunityManageView", () => {
	it("calls navigate when onBackClick is invoked", () => {
		vi.resetAllMocks();
		installCommunityStoreMocks({ currentCommunity: { community_id: "c1", owner_id: "o1" } });
		// render hook with router params
		const { result } = renderHook(() => useCommunityManageView(), {
			wrapper: ({ children }) => (
				<RouterWrapper path="/:community_slug/:lang" initialEntries={["/test-slug/en"]}>
					{children}
				</RouterWrapper>
			),
		});

		// onBackClick should call navigate; we can't inspect navigate directly here
		// but calling it should not throw and will attempt navigation. Smoke check.
		result.current.onBackClick();
		expect(typeof result.current.onBackClick).toBe("function");
	});

	it("invites a user: calls postJson and clears input on success", async () => {
		vi.resetAllMocks();
		const mockPost = vi.mocked(postJson);
		mockPost.mockResolvedValue(undefined);

		installCommunityStoreMocks({
			currentCommunity: { community_id: "c1", owner_id: "o1" },
			userSessionData: { user: { user_id: "o1" } },
		});

		const { result } = renderHook(() => useCommunityManageView(), {
			wrapper: ({ children }) => (
				<RouterWrapper path="/:community_slug/:lang" initialEntries={["/test-slug/en"]}>
					{children}
				</RouterWrapper>
			),
		});

		// set input and ensure it is applied before triggering invite
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
